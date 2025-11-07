from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from service.presentation.schemas.metrics import MetricsResponse


# Graph API Schemas
class NodeCreateSchema(BaseModel):
    """Схема для создания/обновления ноды

    id опционален: если передан, будет использован как идентификатор ноды.
    Это помогает сохранять согласованность с ребрами на стороне клиента.
    """

    id: Optional[str] = Field(None, description="Идентификатор ноды (опционально)")
    type: str = Field(..., description="Тип ноды")
    position: Dict[str, float] = Field(
        default_factory=lambda: {"x": 0, "y": 0}, description="Позиция ноды"
    )
    data: Dict[str, Any] = Field(default_factory=dict, description="Данные ноды")


class EdgeCreateSchema(BaseModel):
    """Схема для создания связи"""

    source: str = Field(..., description="ID исходной ноды")
    sourceHandle: str = Field(..., description="Имя выходного порта")
    target: str = Field(..., description="ID целевой ноды")
    targetHandle: str = Field(..., description="Имя входного порта")


class GraphCreateSchema(BaseModel):
    """Схема для создания графа"""

    name: str = Field(..., description="Название графа", min_length=1, max_length=255)
    description: Optional[str] = Field(None, description="Описание графа")
    nodes: List[NodeCreateSchema] = Field(default_factory=list, description="Ноды графа")
    edges: List[EdgeCreateSchema] = Field(default_factory=list, description="Связи между нодами")


class GraphUpdateSchema(BaseModel):
    """Схема для обновления графа"""

    name: Optional[str] = Field(None, description="Название графа", min_length=1, max_length=255)
    description: Optional[str] = Field(None, description="Описание графа")
    nodes: Optional[List[NodeCreateSchema]] = Field(None, description="Ноды графа")
    edges: Optional[List[EdgeCreateSchema]] = Field(None, description="Связи между нодами")
    is_active: Optional[bool] = Field(None, description="Активность графа")


class NodeResponseSchema(BaseModel):
    """Схема ответа для ноды"""

    id: str
    type: str
    position: Dict[str, float]
    data: Dict[str, Any]


class EdgeResponseSchema(BaseModel):
    """Схема ответа для связи"""

    id: str
    source: str
    sourceHandle: str
    target: str
    targetHandle: str


class GraphResponseSchema(BaseModel):
    """Схема ответа для графа"""

    id: UUID
    name: str
    description: Optional[str]
    nodes: List[NodeResponseSchema]
    edges: List[EdgeResponseSchema]
    is_active: bool
    version: int
    created_at: datetime
    updated_at: Optional[datetime]


class GraphListResponseSchema(BaseModel):
    """Схема ответа для списка графов"""

    graphs: List[GraphResponseSchema]
    total: int
    page: int
    size: int


# Graph Execution Schemas
class GraphExecuteSchema(BaseModel):
    """Схема для запуска выполнения графа"""

    input_data: Optional[Dict[str, Any]] = Field(None, description="Входные данные для выполнения")


class GraphExecutionResponseSchema(BaseModel):
    """Схема ответа для выполнения графа"""

    id: UUID
    graph_id: UUID
    status: str
    input_data: Optional[Dict[str, Any]]
    output_data: Optional[Dict[str, Any]]
    error_data: Optional[Dict[str, Any]]
    execution_time_ms: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime


# Node Registry Schemas
class NodePortSchema(BaseModel):
    """Схема для порта ноды"""

    name: str
    type: str
    description: str
    required: bool
    multiple: Optional[bool] = None  # Только для входных портов


class NodeMetaSchema(BaseModel):
    """Схема для метаданных ноды"""

    name: str
    category: str
    description: str
    icon: str
    tags: List[str]
    version: str


class NodeConfigFieldSchema(BaseModel):
    """Схема для поля конфигурации ноды"""

    name: str
    type: str  # string, number, boolean, enum
    title: Optional[str] = None
    description: Optional[str] = None
    default: Optional[Any] = None
    required: bool = False
    enum: Optional[List[Any]] = None  # Для enum типов
    minimum: Optional[float] = None  # Для числовых типов
    maximum: Optional[float] = None  # Для числовых типов
    minLength: Optional[int] = None  # Для строк
    maxLength: Optional[int] = None  # Для строк


class NodeTypeSchema(BaseModel):
    """Схема для типа ноды"""

    type: str
    meta: NodeMetaSchema
    inputs: Dict[str, NodePortSchema]
    outputs: Dict[str, NodePortSchema]
    config_schema: Optional[Dict[str, NodeConfigFieldSchema]] = None


class NodeRegistryResponseSchema(BaseModel):
    """Схема ответа реестра нод"""

    categories: Dict[str, List[str]]
    nodes: Dict[str, NodeTypeSchema]


# Telegram Bot Schemas
class TelegramBotCreateSchema(BaseModel):
    """Схема для создания телеграм бота"""

    name: str = Field(..., description="Название бота", min_length=1, max_length=255)
    token: str = Field(..., description="Токен бота от BotFather", min_length=10)
    description: Optional[str] = Field(None, description="Описание бота")
    settings: Optional[Dict[str, Any]] = Field(None, description="Настройки бота")


class TelegramBotUpdateSchema(BaseModel):
    """Схема для обновления телеграм бота"""

    name: Optional[str] = Field(None, description="Название бота", min_length=1, max_length=255)
    description: Optional[str] = Field(None, description="Описание бота")
    is_active: Optional[bool] = Field(None, description="Активность бота")
    settings: Optional[Dict[str, Any]] = Field(None, description="Настройки бота")


class TelegramBotResponseSchema(BaseModel):
    """Схема ответа для телеграм бота"""

    id: UUID
    name: str
    username: Optional[str]
    description: Optional[str]
    is_active: bool
    webhook_url: Optional[str]
    job_status: Optional[str]
    settings: Optional[Dict[str, Any]]


# --------- New: Minimal ML pipeline v1 schemas ---------


class DatasetResponse(BaseModel):
    id: UUID
    user_id: UUID
    launch_id: UUID | None
    mode: str
    name: str
    file_url: str
    version: int
    created_at: datetime

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


class TelegramBotStatusResponseSchema(BaseModel):
    """
    Статус бота и статистика очереди сообщений
    """

    id: UUID
    is_active: bool
    webhook_url: Optional[str]
    queue_counts: Dict[str, int] = Field(default_factory=dict)
    last_processed: Optional[datetime] = None


class TelegramBotLifecycleAction(BaseModel):
    """
    Запрос на изменение состояния бота (activate/deactivate/restart)
    """

    action: str = Field(..., description="activate|deactivate|restart")


# Telegram Trigger Schemas
class TelegramTriggerCreateSchema(BaseModel):
    """Схема для создания триггера"""

    bot_id: UUID = Field(..., description="ID бота")
    graph_id: UUID = Field(..., description="ID графа для выполнения")
    name: str = Field(..., description="Название триггера", min_length=1, max_length=255)
    trigger_type: str = Field(..., description="Тип триггера (command, keyword, mention, callback)")
    trigger_pattern: str = Field(..., description="Паттерн триггера", min_length=1, max_length=500)
    description: Optional[str] = Field(None, description="Описание триггера")
    priority: int = Field(100, description="Приоритет триггера", ge=1, le=1000)
    settings: Optional[Dict[str, Any]] = Field(None, description="Настройки триггера")


class TelegramTriggerUpdateSchema(BaseModel):
    """Схема для обновления триггера"""

    name: Optional[str] = Field(None, description="Название триггера", min_length=1, max_length=255)
    trigger_type: Optional[str] = Field(None, description="Тип триггера")
    trigger_pattern: Optional[str] = Field(
        None, description="Паттерн триггера", min_length=1, max_length=500
    )
    description: Optional[str] = Field(None, description="Описание триггера")
    is_active: Optional[bool] = Field(None, description="Активность триггера")
    priority: Optional[int] = Field(None, description="Приоритет триггера", ge=1, le=1000)
    settings: Optional[Dict[str, Any]] = Field(None, description="Настройки триггера")


class TelegramTriggerResponseSchema(BaseModel):
    """Схема ответа для триггера"""

    id: UUID
    bot_id: UUID
    graph_id: UUID
    name: str
    trigger_type: str
    trigger_pattern: str
    description: Optional[str]
    is_active: bool
    priority: int
    settings: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: Optional[datetime]


# Webhook handling schemas
class TelegramWebhookSchema(BaseModel):
    """Схема для обработки вебхука телеграм"""

    update_id: int
    message: Optional[Dict[str, Any]] = None
    edited_message: Optional[Dict[str, Any]] = None
    channel_post: Optional[Dict[str, Any]] = None
    edited_channel_post: Optional[Dict[str, Any]] = None
    callback_query: Optional[Dict[str, Any]] = None
