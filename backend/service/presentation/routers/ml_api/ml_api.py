"""Minimal ML API (v1): datasets, training runs, artifacts lists."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from service.models.auth_models import AuthProfile
from service.models.key_value import ServiceMode
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.ml_api.schemas import (
    ArtifactDeleteResponse,
    DatasetResponse,
    DatasetTTLResponse,
    DatasetUploadResponse,
    MetricsSummaryResponse,
    MetricTrendPoint,
    ModelArtifactResponse,
    TrainingRunResponse,
)
from service.repositories.file_repository import FileRepository
from service.repositories.training_repository import TrainingRepository
from service.services.file_saver_service import FileSaverService

ml_router = APIRouter(prefix="/api/ml/v1")


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


@ml_router.get("/datasets", response_model=list[DatasetResponse])
async def list_datasets(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    limit: int = Query(20, ge=1, le=100),
    repo: TrainingRepository = Depends(get_training_repo),
):
    items = await repo.list_datasets(profile.user_id, limit=limit)
    return items


@ml_router.post("/datasets/upload", response_model=DatasetUploadResponse, status_code=201)
async def upload_dataset(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    mode: ServiceMode = Query(ServiceMode.LIPS),
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

    # Register Dataset
    dataset = await repo.get_or_create_dataset_from_file(
        user_id=profile.user_id,
        launch_id=None,
        mode=mode,
        file_name=file.filename,
        file_url=upload_resp.file_url,
    )

    return DatasetUploadResponse(
        dataset_id=dataset.id,
        file_url=dataset.file_url,
        name=dataset.name,
        mode=dataset.mode.value if hasattr(dataset.mode, "value") else str(dataset.mode),
        version=getattr(dataset, "version", 1),
        created_at=dataset.created_at,
    )


@ml_router.get("/metrics/trends", response_model=list[MetricTrendPoint])
async def list_metrics_trends(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    mode: ServiceMode | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    repo: TrainingRepository = Depends(get_training_repo),
):
    """Список точек тренда метрик обучения.

    Возвращает последние запуски обучения с их метриками и версией датасета.
    Параметры:
    - mode: фильтр по режиму датасета (опционально)
    - limit: максимум точек (по умолчанию 50)
    """
    rows = await repo.list_training_metrics_trends(profile.user_id, mode=mode, limit=limit)
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
    repo: TrainingRepository = Depends(get_training_repo),
):
    """Агрегированная сводка метрик по последним запускам.

    Возвращает агрегаты (count, averages) и ту же выборку трендов
    для унификации с фронтендом.
    """
    rows = await repo.list_training_metrics_trends(profile.user_id, mode=mode, limit=limit)
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
        "classification_count": classification_count or None,
        "regression_count": regression_count or None,
        "best_accuracy": max(acc_values) if acc_values else None,
        "best_r2": max(r2_values) if r2_values else None,
        "best_mse": (min(mse_values) if mse_values else None),
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
