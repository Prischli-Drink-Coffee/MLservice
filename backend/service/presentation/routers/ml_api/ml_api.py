"""Minimal ML API (v1): datasets, training runs, artifacts lists."""

import csv
import logging
import os
from pathlib import Path
from types import SimpleNamespace
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse

from service.models.auth_models import AuthProfile
from service.models.key_value import ServiceMode
from service.monitoring.metrics import record_dataset_upload
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.ml_api.schemas import (
    ArtifactDeleteResponse,
    DatasetDeleteResponse,
    DatasetResponse,
    DatasetTTLResponse,
    DatasetUploadResponse,
    MetricsSummaryResponse,
    MetricTrendPoint,
    ModelArtifactResponse,
    PresignedUrlResponse,
    TrainingRunResponse,
)
from service.repositories.file_repository import FileRepository
from service.repositories.training_repository import TrainingRepository
from service.services.file_saver_service import FileSaverService
from service.settings import config

logger = logging.getLogger(__name__)
ml_router = APIRouter(prefix="/api/ml/v1")


def _storage_root() -> Path:
    return Path(os.getenv("STORAGE_ROOT", "/var/lib/app/storage")).resolve()


def _normalize_dataset_display_name(file_name: str) -> str:
    candidate = Path(file_name).name.strip()
    if not candidate:
        candidate = "dataset.csv"
    return candidate[:255]


async def _resolve_user_file_or_dataset(
    *,
    user_id,
    file_id,
    file_repo: FileRepository,
    repo: TrainingRepository,
):
    dataset = None
    user_file = await file_repo.fetch_user_file_by_id(user_id, file_id)
    if not user_file:
        dataset = await repo.get_dataset_by_id(user_id, file_id)
        if not dataset:
            return None, None
        storage_key = getattr(dataset, "storage_key", None) or dataset.name
        user_file = await file_repo.fetch_user_file_by_name(user_id, storage_key)

    if not user_file and dataset:
        storage_key = getattr(dataset, "storage_key", None) or dataset.name
        user_file = SimpleNamespace(file_name=storage_key, file_url=dataset.file_url)

    return dataset, user_file


def _resolve_local_file_path(file_url: str | None) -> Path | None:
    if not file_url:
        return None
    root = _storage_root()
    candidates: list[Path] = []
    path = Path(file_url)
    if path.is_absolute():
        candidates.append(path)
    if file_url.startswith("/storage/"):
        candidates.append(root / file_url[len("/storage/") :])
    if not path.is_absolute():
        candidates.append(root / file_url.lstrip("/"))

    for candidate in candidates:
        try:
            resolved = candidate.resolve()
        except FileNotFoundError:
            continue
        try:
            resolved.relative_to(root)
        except ValueError:
            continue
        if resolved.is_file():
            return resolved
    return None


def _build_local_download_route(file_id) -> str:
    return f"/api/ml/v1/files/{file_id}/download"


def _build_local_artifact_download_route(artifact_id) -> str:
    return f"/api/ml/v1/artifacts/{artifact_id}/download"


def _extract_csv_columns(file_path: Path, limit: int = 200) -> list[str]:
    try:
        with file_path.open("r", encoding="utf-8", errors="replace", newline="") as fh:
            reader = csv.reader(fh)
            header = next(reader, [])
    except Exception:
        return []

    columns: list[str] = []
    for idx, cell in enumerate(header[:limit]):
        value = (cell or "").strip()
        if not value:
            value = f"column_{idx + 1}"
        columns.append(value[:255])
    return columns


DATASET_REMOVED_CODE = "DATASET_REMOVED"
FILE_NOT_FOUND_CODE = "FILE_NOT_FOUND"


async def _cleanup_missing_dataset(
    *,
    user_id,
    dataset,
    user_file,
    file_repo: FileRepository,
    repo: TrainingRepository,
):
    deleted_dataset = False
    if dataset:
        try:
            deleted_dataset = await repo.delete_dataset(user_id=user_id, dataset_id=dataset.id)
        except Exception:  # noqa: BLE001
            deleted_dataset = False

    file_id = getattr(user_file, "id", None)
    if file_id:
        try:
            await file_repo.delete_file_metadata(user_id=user_id, file_id=file_id)
        except Exception:  # noqa: BLE001
            pass

    return deleted_dataset


def _missing_file_http_error(dataset_id, deleted: bool) -> HTTPException:
    code = DATASET_REMOVED_CODE if deleted else FILE_NOT_FOUND_CODE
    message = (
        "Файл датасета недоступен и запись была удалена" if deleted else "Файл датасета недоступен"
    )
    detail = {"code": code, "message": message}
    if dataset_id is not None:
        detail["dataset_id"] = str(dataset_id)
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _artifact_storage_key(model_url: str) -> str:
    if model_url.startswith("/storage/"):
        return model_url[len("/storage/") :]
    return model_url.lstrip("/")


async def _get_artifact_or_404(
    *,
    user_id: UUID,
    artifact_id: UUID,
    repo: TrainingRepository,
):
    artifact = await repo.get_artifact_by_id(user_id, artifact_id)
    if not artifact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Артефакт не найден")

    model_url = getattr(artifact, "model_url", None)
    if not model_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл артефакта отсутствует",
        )
    return artifact, model_url


def get_training_repo() -> TrainingRepository:
    from service import container as _container

    return _container.get(_container.TrainingRepositoryName)


def get_file_saver() -> FileSaverService:
    from service import container as _container

    return _container.get(_container.FileSaverServiceName)


def get_file_repo() -> FileRepository:
    from service import container as _container

    return _container.get(_container.FileRepositoryName)


@ml_router.get("/training-runs", response_model=list[TrainingRunResponse])
async def list_training_runs(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    limit: int = Query(20, ge=1, le=100),
    repo: TrainingRepository = Depends(get_training_repo),
):
    items = await repo.list_training_runs(profile.user_id, limit=limit)
    return items


@ml_router.get("/artifacts", response_model=list[ModelArtifactResponse])
async def list_artifacts(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    limit: int = Query(20, ge=1, le=100),
    repo: TrainingRepository = Depends(get_training_repo),
):
    items = await repo.list_artifacts(profile.user_id, limit=limit)
    return items


@ml_router.delete(
    "/artifacts/{artifact_id}", response_model=ArtifactDeleteResponse, status_code=200
)
async def delete_artifact(
    artifact_id: str,
    profile: Annotated[AuthProfile, Depends(check_auth)],
    repo: TrainingRepository = Depends(get_training_repo),
):
    """Удаление артефакта модели и связанного файла.

    Поведение:
    - 404 если артефакт не принадлежит пользователю или не существует.
    - Удаляет запись из БД, затем пытается удалить файл на диске.
    """
    import logging as _logging
    import os as _os
    from uuid import UUID as _UUID

    logger = _logging.getLogger(__name__)

    try:
        art_uuid = _UUID(artifact_id)
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Некорректный UUID")

    model_url = await repo.delete_artifact(profile.user_id, art_uuid)
    if model_url is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Артефакт не найден")

    # Map URL to storage path similar to TrainingService logic
    def _resolve(path_url: str) -> str:
        if path_url.startswith("/storage/"):
            rel = path_url[len("/storage/") :]
            root = _os.getenv("STORAGE_ROOT", "/var/lib/app/storage")
            return _os.path.join(root, rel)
        if _os.path.isabs(path_url):
            return path_url
        root = _os.getenv("STORAGE_ROOT", "/var/lib/app/storage")
        return _os.path.join(root, path_url)

    abs_path = _resolve(model_url)
    try:
        _os.remove(abs_path)
    except FileNotFoundError:
        logger.debug("Файл артефакта уже отсутствует: %s", abs_path)
    except Exception as e:  # noqa: BLE001
        logger.warning("Ошибка удаления файла артефакта %s: %s", abs_path, e)

    return ArtifactDeleteResponse(id=art_uuid)


@ml_router.get("/artifacts/{artifact_id}/download-url", response_model=PresignedUrlResponse)
async def get_artifact_download_url(
    artifact_id: UUID,
    profile: Annotated[AuthProfile, Depends(check_auth)],
    expiry_sec: int = Query(3600, ge=60, le=86400),
    repo: TrainingRepository = Depends(get_training_repo),
    saver: FileSaverService = Depends(get_file_saver),
):
    artifact, model_url = await _get_artifact_or_404(
        user_id=profile.user_id, artifact_id=artifact_id, repo=repo
    )

    storage_backend = os.getenv("STORAGE_BACKEND", "local").lower()
    if storage_backend != "local":
        file_key = _artifact_storage_key(model_url)
        try:
            presigned = await saver.get_presigned_url_by_key(
                file_key=file_key, expiry_sec=expiry_sec
            )
        except Exception:  # noqa: BLE001
            presigned = None

        if presigned:
            return PresignedUrlResponse(
                file_id=artifact.id,
                url=presigned,
                expiry_sec=expiry_sec,
                backend=storage_backend,
            )

    file_path = _resolve_local_file_path(model_url)
    if file_path:
        return PresignedUrlResponse(
            file_id=artifact.id,
            url=_build_local_artifact_download_route(artifact.id),
            expiry_sec=expiry_sec,
            backend="local",
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Файл артефакта недоступен",
    )


@ml_router.get("/artifacts/{artifact_id}/download")
async def download_artifact(
    artifact_id: UUID,
    profile: Annotated[AuthProfile, Depends(check_auth)],
    repo: TrainingRepository = Depends(get_training_repo),
):
    _, model_url = await _get_artifact_or_404(
        user_id=profile.user_id, artifact_id=artifact_id, repo=repo
    )

    file_path = _resolve_local_file_path(model_url)
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Файл артефакта недоступен",
        )

    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type="application/octet-stream",
    )


@ml_router.get("/datasets", response_model=list[DatasetResponse])
async def list_datasets(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    limit: int = Query(20, ge=1, le=100),
    repo: TrainingRepository = Depends(get_training_repo),
    saver: FileSaverService = Depends(get_file_saver),
    file_repo: FileRepository = Depends(get_file_repo),
):
    """Список датасетов пользователя с presigned URLs (если MinIO включён)."""
    items = await repo.list_datasets(profile.user_id, limit=limit)

    # Add presigned URLs if storage backend supports it
    result = []
    for dataset in items:
        dataset_response = DatasetResponse.model_validate(dataset)

        # Try to get presigned URL for MinIO backend
        download_url = None
        columns: list[str] | None = None
        try:
            storage_key = getattr(dataset, "storage_key", None) or dataset.name
            # Get file metadata to retrieve file_name (storage key)
            user_file = await file_repo.fetch_user_file_by_name(profile.user_id, storage_key)
            if user_file:
                presigned_url = await saver.get_presigned_url_by_key(
                    file_key=user_file.file_name, expiry_sec=3600  # 1 hour default
                )
                if presigned_url:
                    download_url = presigned_url
                file_url = user_file.file_url
            else:
                file_url = dataset.file_url

            file_path = _resolve_local_file_path(file_url)
            if file_path:
                cols = _extract_csv_columns(file_path)
                if cols:
                    columns = cols
        except Exception:
            # If presigned URL generation fails, just skip it
            pass

        if download_url:
            dataset_response = dataset_response.model_copy(update={"download_url": download_url})

        if columns is not None:
            dataset_response = dataset_response.model_copy(update={"columns": columns})

        result.append(dataset_response)

    return result


@ml_router.post("/datasets/upload", response_model=DatasetUploadResponse, status_code=201)
async def upload_dataset(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    mode: ServiceMode = Query(ServiceMode.TRAINING),
    file: UploadFile = File(...),
    saver: FileSaverService = Depends(get_file_saver),
    repo: TrainingRepository = Depends(get_training_repo),
    file_repo: FileRepository = Depends(get_file_repo),
):
    """Загрузка CSV датасета и регистрация Dataset записи.

    Валидация:
    - расширение .csv
    - размер > 0 байт
    - базовая проверка CSV (не пустой, >= 2 колонки)
    """
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Только .csv поддерживается"
        )

    import os

    raw = await file.read()
    if len(raw) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Пустой файл")

    # Size limit (env MAX_CSV_UPLOAD_BYTES, default 10 MiB)
    try:
        max_bytes = int(os.getenv("MAX_CSV_UPLOAD_BYTES", str(10 * 1024 * 1024)))
    except Exception:
        max_bytes = 10 * 1024 * 1024
    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE, detail="Файл слишком большой"
        )

    # Lightweight CSV validation without heavy deps to avoid Windows NumPy access violation
    try:
        import csv
        import io

        # Decode to text stream; tolerate minor encoding issues
        text_stream = io.TextIOWrapper(
            io.BytesIO(raw), encoding="utf-8", errors="replace", newline=""
        )
        reader = csv.reader(text_stream)

        header = next(reader, None)
        if not header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Отсутствует заголовок CSV"
            )
        cleaned_header = [c.strip() for c in header if c is not None and str(c).strip() != ""]
        if len(cleaned_header) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Недостаточно колонок в CSV"
            )

        data_rows = []
        for row in reader:
            if row and any(str(cell).strip() != "" for cell in row):
                data_rows.append(row)

        if not data_rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Пустой CSV без данных"
            )

        # Minimum data rows (env MIN_CSV_DATA_ROWS, default 2)
        try:
            import os as _os

            min_rows = int(_os.getenv("MIN_CSV_DATA_ROWS", "2"))
        except Exception:
            min_rows = 2
        if len(data_rows) < min_rows:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Недостаточно строк данных: {len(data_rows)} < {min_rows}",
            )

        # NaN / пустые значения доля (env MAX_EMPTY_RATIO, default 0.5)
        try:
            max_empty_ratio = float(_os.getenv("MAX_EMPTY_RATIO", "0.5"))
        except Exception:
            max_empty_ratio = 0.5
        total_cells = len(data_rows) * len(cleaned_header)
        empty_cells = 0
        for r in data_rows:
            empty_cells += sum(
                1
                for cell in r
                if str(cell).strip() == "" or cell.lower() in {"nan", "none", "null"}
            )
        if total_cells > 0 and (empty_cells / total_cells) > max_empty_ratio:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Слишком много пустых значений в CSV",
            )
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ошибка чтения CSV: {e}"
        )

    # Persist file via FileSaverService (will generate masked name)
    upload_resp = await saver.save(profile.user_id, mode, file.filename, raw)

    display_name = _normalize_dataset_display_name(file.filename)
    storage_key = upload_resp.file_key or upload_resp.file_url or display_name

    # Register Dataset
    dataset = await repo.get_or_create_dataset_from_file(
        user_id=profile.user_id,
        launch_id=None,
        mode=mode,
        display_name=display_name,
        storage_key=storage_key,
        file_url=upload_resp.file_url,
    )

    # Attempt presigned URL if supported
    presigned: str | None = None
    try:
        if upload_resp.file_key:
            presigned = await saver.get_presigned_url_by_key(
                file_key=upload_resp.file_key,
                expiry_sec=int(os.getenv("MINIO_PRESIGN_EXP", "3600")),
            )
    except Exception:
        presigned = None

    record_dataset_upload(mode=mode, size_bytes=len(raw))

    return DatasetUploadResponse(
        dataset_id=dataset.id,
        file_url=dataset.file_url,
        name=dataset.name,  # original file name stored with dataset
        mode=dataset.mode.value if hasattr(dataset.mode, "value") else str(dataset.mode),
        version=getattr(dataset, "version", 1),
        created_at=dataset.created_at,
        download_url=presigned,
    )


@ml_router.delete("/datasets/{dataset_id:uuid}", response_model=DatasetDeleteResponse)
async def delete_dataset(
    dataset_id: UUID,
    profile: Annotated[AuthProfile, Depends(check_auth)],
    repo: TrainingRepository = Depends(get_training_repo),
    file_repo: FileRepository = Depends(get_file_repo),
    saver: FileSaverService = Depends(get_file_saver),
):
    dataset = await repo.get_dataset_by_id(profile.user_id, dataset_id)
    if not dataset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Датасет не найден")

    deleted = await repo.delete_dataset(profile.user_id, dataset_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Датасет уже удалён или недоступен",
        )

    storage_key = getattr(dataset, "storage_key", None) or dataset.name
    file_removed = False
    file_metadata_deleted = False

    if storage_key:
        try:
            await file_repo.delete_file_metadata_by_name(profile.user_id, storage_key)
            file_metadata_deleted = True
        except Exception:  # noqa: BLE001
            file_metadata_deleted = False

        try:
            await saver.storage.delete_file(file_key=storage_key)
            file_removed = True
        except FileNotFoundError:
            file_removed = False
        except Exception:  # noqa: BLE001
            file_removed = False

    return DatasetDeleteResponse(
        dataset_id=dataset_id,
        deleted=True,
        file_removed=file_removed,
        file_metadata_deleted=file_metadata_deleted,
    )


@ml_router.get("/files/{file_id}/download-url", response_model=PresignedUrlResponse)
async def get_file_download_url(
    file_id: str,
    profile: Annotated[AuthProfile, Depends(check_auth)],
    expiry_sec: int = Query(3600, ge=1, le=86400),
    saver: FileSaverService = Depends(get_file_saver),
    file_repo: FileRepository = Depends(get_file_repo),
    repo: TrainingRepository = Depends(get_training_repo),
):
    """Получить ссылку для скачивания файла.

    Если backend хранилища поддерживает presigned URLs (например, MinIO),
    возвращается временная ссылка. Иначе — обычный `file_url`.
    """
    from uuid import UUID as _UUID

    try:
        fid = _UUID(file_id)
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Некорректный UUID")

    dataset, user_file = await _resolve_user_file_or_dataset(
        user_id=profile.user_id, file_id=fid, file_repo=file_repo, repo=repo
    )
    if not user_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")

    storage_backend = os.getenv("STORAGE_BACKEND", "local").lower()
    is_local_backend = storage_backend == "local"
    file_url = getattr(user_file, "file_url", None) or (dataset.file_url if dataset else None)

    if not is_local_backend:
        presigned: str | None = None
        try:
            presigned = await saver.get_presigned_url_by_key(
                file_key=user_file.file_name, expiry_sec=expiry_sec
            )
        except Exception:  # noqa: BLE001
            presigned = None

        if presigned:
            return PresignedUrlResponse(
                file_id=fid, url=presigned, expiry_sec=expiry_sec, backend="minio"
            )

        deleted = await _cleanup_missing_dataset(
            user_id=profile.user_id,
            dataset=dataset,
            user_file=user_file,
            file_repo=file_repo,
            repo=repo,
        )
        _missing_file_http_error(fid, deleted)

    file_path = _resolve_local_file_path(file_url)
    if file_path:
        return PresignedUrlResponse(
            file_id=fid,
            url=_build_local_download_route(fid),
            expiry_sec=expiry_sec,
            backend="local",
        )

    deleted = await _cleanup_missing_dataset(
        user_id=profile.user_id,
        dataset=dataset,
        user_file=user_file,
        file_repo=file_repo,
        repo=repo,
    )
    _missing_file_http_error(fid, deleted)


@ml_router.get("/files/{file_id}/download")
async def download_file(
    file_id: str,
    profile: Annotated[AuthProfile, Depends(check_auth)],
    file_repo: FileRepository = Depends(get_file_repo),
    repo: TrainingRepository = Depends(get_training_repo),
):
    from uuid import UUID as _UUID

    try:
        fid = _UUID(file_id)
    except Exception:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Некорректный UUID")

    dataset, user_file = await _resolve_user_file_or_dataset(
        user_id=profile.user_id, file_id=fid, file_repo=file_repo, repo=repo
    )
    if not user_file:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")

    file_url = getattr(user_file, "file_url", None) or (dataset.file_url if dataset else None)
    file_path = _resolve_local_file_path(file_url)
    if not file_path:
        deleted = await _cleanup_missing_dataset(
            user_id=profile.user_id,
            dataset=dataset,
            user_file=user_file,
            file_repo=file_repo,
            repo=repo,
        )
        _missing_file_http_error(fid, deleted)

    suffix = file_path.suffix.lower()
    media_type = "text/csv" if suffix == ".csv" else "application/octet-stream"
    return FileResponse(
        path=str(file_path),
        filename=file_path.name,
        media_type=media_type,
    )


@ml_router.get("/metrics/trends", response_model=list[MetricTrendPoint])
async def list_metrics_trends(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    mode: ServiceMode | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    dataset_id: UUID | None = Query(None),
    target_column: str | None = Query(None),
    repo: TrainingRepository = Depends(get_training_repo),
):
    """Список точек тренда метрик обучения.

    Возвращает последние запуски обучения с их метриками и версией датасета.
    Параметры:
    - mode: фильтр по режиму датасета (опционально)
    - limit: максимум точек (по умолчанию 50)
    """
    rows = await repo.list_training_metrics_trends(
        profile.user_id,
        mode=mode,
        limit=limit,
        dataset_id=dataset_id,
        target_column=target_column,
    )
    return [
        MetricTrendPoint(
            run_id=tr.id,
            created_at=tr.created_at,
            version=version,
            metrics=tr.metrics if tr.metrics else None,
        )
        for tr, version in rows
    ]


@ml_router.get("/metrics/summary", response_model=MetricsSummaryResponse)
async def get_metrics_summary(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    mode: ServiceMode | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    dataset_id: UUID | None = Query(None),
    target_column: str | None = Query(None),
    repo: TrainingRepository = Depends(get_training_repo),
):
    """Агрегированная сводка метрик по последним запускам.

    Возвращает агрегаты (count, averages) и ту же выборку трендов
    для унификации с фронтендом.
    """
    rows = await repo.list_training_metrics_trends(
        profile.user_id,
        mode=mode,
        limit=limit,
        dataset_id=dataset_id,
        target_column=target_column,
    )
    trends = [
        MetricTrendPoint(
            run_id=tr.id,
            created_at=tr.created_at,
            version=version,
            metrics=tr.metrics if tr.metrics else None,
        )
        for tr, version in rows
    ]

    # Aggregate
    acc_values: list[float] = []
    r2_values: list[float] = []
    mse_values: list[float] = []
    classification_count = 0
    regression_count = 0
    for tp in trends:
        m = tp.metrics
        if not m:
            continue
        # Heuristic: task field present; rely on reported task
        if m.task == "classification":
            classification_count += 1
        elif m.task == "regression":
            regression_count += 1
        if m.accuracy is not None:
            acc_values.append(float(m.accuracy))
        if m.r2 is not None:
            r2_values.append(float(m.r2))
        if m.mse is not None:
            mse_values.append(float(m.mse))

    def _avg(values: list[float]) -> float | None:
        return (sum(values) / len(values)) if values else None

    aggregates = {
        "count": len(trends),
        "avg_accuracy": _avg(acc_values),
        "avg_r2": _avg(r2_values),
        "avg_mse": _avg(mse_values),
        "avg_precision": _avg(
            [
                float(m.metrics.precision)
                for m in trends
                if m.metrics and m.metrics.precision is not None
            ]
        ),
        "avg_recall": _avg(
            [float(m.metrics.recall) for m in trends if m.metrics and m.metrics.recall is not None]
        ),
        "avg_f1": _avg(
            [float(m.metrics.f1) for m in trends if m.metrics and m.metrics.f1 is not None]
        ),
        "avg_mae": _avg(
            [float(m.metrics.mae) for m in trends if m.metrics and m.metrics.mae is not None]
        ),
        "classification_count": classification_count or None,
        "regression_count": regression_count or None,
        "best_accuracy": max(acc_values) if acc_values else None,
        "best_r2": max(r2_values) if r2_values else None,
        "best_mse": (min(mse_values) if mse_values else None),
        "best_precision": (
            max(
                [
                    float(m.metrics.precision)
                    for m in trends
                    if m.metrics and m.metrics.precision is not None
                ]
            )
            if any(m.metrics and m.metrics.precision is not None for m in trends)
            else None
        ),
        "best_recall": (
            max(
                [
                    float(m.metrics.recall)
                    for m in trends
                    if m.metrics and m.metrics.recall is not None
                ]
            )
            if any(m.metrics and m.metrics.recall is not None for m in trends)
            else None
        ),
        "best_f1": (
            max([float(m.metrics.f1) for m in trends if m.metrics and m.metrics.f1 is not None])
            if any(m.metrics and m.metrics.f1 is not None for m in trends)
            else None
        ),
        "best_mae": (
            min([float(m.metrics.mae) for m in trends if m.metrics and m.metrics.mae is not None])
            if any(m.metrics and m.metrics.mae is not None for m in trends)
            else None
        ),
    }

    from service.presentation.routers.ml_api.schemas import MetricsAggregate, MetricsSummaryResponse

    return MetricsSummaryResponse(
        aggregates=MetricsAggregate(**aggregates),
        trends=trends,
    )


@ml_router.delete("/datasets/expired", response_model=DatasetTTLResponse)
async def cleanup_expired_datasets(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    limit: int = Query(1000, ge=1, le=5000),
    repo: TrainingRepository = Depends(get_training_repo),
    saver: FileSaverService = Depends(get_file_saver),
):
    """Удалить просроченные датасеты и связанные training_runs по TTL.

    TTL берётся из переменной окружения DATASET_TTL_DAYS (по умолчанию 30).
    Удаляются записи из БД, затем физические файлы через активный storage backend.
    """
    import os
    from datetime import datetime, timedelta, timezone

    if str(profile.user_id).lower() not in config.admin_user_ids_set:
        raise HTTPException(status.HTTP_403_FORBIDDEN, detail="Admin access required")

    try:
        ttl_days = int(os.getenv("DATASET_TTL_DAYS", "30"))
    except Exception:
        ttl_days = 30

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=ttl_days)

    file_keys = await repo.cleanup_expired_datasets(cutoff=cutoff, limit=limit)

    files_removed = 0
    files_missing = 0
    for key in file_keys:
        try:
            await saver.storage.delete_file(file_key=key)
            files_removed += 1
        except FileNotFoundError:
            files_missing += 1
        except Exception:
            # non-fatal
            files_missing += 1

    return DatasetTTLResponse(
        cutoff=cutoff,
        limit=limit,
        deleted=len(file_keys),
        files_removed=files_removed,
        files_missing=files_missing,
    )
