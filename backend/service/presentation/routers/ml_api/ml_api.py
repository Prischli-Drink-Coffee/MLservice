"""Minimal ML API (v1): datasets, training runs, artifacts lists."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from service.models.auth_models import AuthProfile
from service.models.key_value import ServiceMode
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.ml_api.schemas import (
    DatasetResponse,
    DatasetUploadResponse,
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
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Файл слишком большой"
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
        if not header or len([c for c in header if c is not None and str(c).strip() != ""]) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Недостаточно колонок в CSV"
            )

        # Ensure at least one non-empty data row
        has_row = False
        for row in reader:
            # Skip completely empty lines
            if row and any(str(cell).strip() != "" for cell in row):
                has_row = True
                break

        if not has_row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Пустой CSV без данных"
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
        created_at=dataset.created_at,
    )
