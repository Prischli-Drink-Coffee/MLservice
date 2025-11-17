from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from service.presentation.schemas.metrics import MetricsResponse


class DatasetResponse(BaseModel):
    id: UUID
    user_id: UUID
    launch_id: UUID | None
    mode: str
    name: str
    file_url: str
    version: int
    created_at: datetime
    download_url: str | None = None  # Presigned URL if MinIO backend is used
    columns: list[str] | None = None

    model_config = ConfigDict(from_attributes=True)


class TrainingRunResponse(BaseModel):
    id: UUID
    user_id: UUID
    launch_id: UUID
    dataset_id: UUID
    status: str
    model_url: str | None
    metrics: MetricsResponse | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ModelArtifactResponse(BaseModel):
    id: UUID
    user_id: UUID
    launch_id: UUID
    model_url: str
    metrics: MetricsResponse | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
    updated_at: Optional[datetime]


class ArtifactDeleteResponse(BaseModel):
    """Ответ на удаление артефакта модели."""

    id: UUID
    deleted: bool = True


class MetricTrendPoint(BaseModel):
    """Точка тренда метрик обучения.

    Представляет отдельный запуск обучения с его метриками и версией датасета.
    Используется для построения графиков динамики качества модели.
    """

    run_id: UUID
    created_at: datetime
    version: int
    metrics: MetricsResponse | None = None

    model_config = ConfigDict(from_attributes=True)


class MetricsAggregate(BaseModel):
    """Агрегированные метрики по последним запускам."""

    count: int = Field(..., description="Число запусков в выборке")
    classification_count: int | None = Field(
        None, description="Число классификационных запусков в выборке"
    )
    regression_count: int | None = Field(None, description="Число регрессионных запусков в выборке")
    avg_accuracy: float | None = Field(
        None, description="Средняя accuracy по классификации (если есть хотя бы один)"
    )
    avg_r2: float | None = Field(None, description="Средний R^2 по регрессии")
    avg_mse: float | None = Field(None, description="Средний MSE по регрессии")
    avg_precision: float | None = Field(None, description="Средняя precision по классификации")
    avg_recall: float | None = Field(None, description="Средняя recall по классификации")
    avg_f1: float | None = Field(None, description="Средняя F1 по классификации")
    avg_mae: float | None = Field(None, description="Средняя MAE по регрессии")
    best_accuracy: float | None = Field(None, description="Лучшая accuracy по классификации")
    best_r2: float | None = Field(None, description="Лучший R^2 по регрессии")
    best_mse: float | None = Field(None, description="Лучший (минимальный) MSE по регрессии")
    best_precision: float | None = Field(None, description="Лучшая precision по классификации")
    best_recall: float | None = Field(None, description="Лучшая recall по классификации")
    best_f1: float | None = Field(None, description="Лучшая F1 по классификации")
    best_mae: float | None = Field(None, description="Лучшая (минимальная) MAE по регрессии")


class MetricsSummaryResponse(BaseModel):
    """Ответ summary метрик: агрегаты + точки тренда (опционально усечённые)."""

    aggregates: MetricsAggregate
    trends: list[MetricTrendPoint]


class DatasetTTLResponse(BaseModel):
    """Результат очистки просроченных датасетов."""

    cutoff: datetime
    limit: int
    deleted: int
    files_removed: int
    files_missing: int


class DatasetDeleteResponse(BaseModel):
    """Ответ на удаление конкретного датасета."""

    dataset_id: UUID
    deleted: bool = Field(..., description="Удалена ли запись в БД")
    file_removed: bool = Field(
        False, description="Удалён ли файл из storage (или отсутствовал изначально)"
    )
    file_metadata_deleted: bool = Field(
        False, description="Удалена ли запись о файле из user_file"
    )


class DatasetUploadResponse(BaseModel):
    """Ответ на успешную загрузку датасета (CSV)."""

    dataset_id: UUID
    file_url: str
    name: str
    mode: str
    version: int
    created_at: datetime
    # Если доступно: временная ссылка для скачивания, напр. из MinIO
    download_url: Optional[str] = None


class PresignedUrlResponse(BaseModel):
    """Ссылка для скачивания файла (presigned URL, если доступен у backend'а)."""

    file_id: UUID
    url: str
    expiry_sec: Optional[int] = None
    backend: Optional[str] = None


__all__ = [
    "DatasetResponse",
    "TrainingRunResponse",
    "ModelArtifactResponse",
    "ArtifactDeleteResponse",
    "MetricTrendPoint",
    "MetricsAggregate",
    "MetricsSummaryResponse",
    "DatasetTTLResponse",
    "DatasetDeleteResponse",
    "DatasetUploadResponse",
    "PresignedUrlResponse",
]
