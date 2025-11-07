import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class NodeData(BaseModel):
    """Данные ноды в графе"""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
    data: Dict[str, Any] = Field(default_factory=dict)


class EdgeData(BaseModel):
    """Данные связи между нодами"""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source: str
    sourceHandle: str
    target: str
    targetHandle: str


class GraphLogic(BaseModel):
    """Логическая модель графа"""

    id: UUID = Field(default_factory=uuid.uuid4)
    user_id: UUID
    name: str
    description: Optional[str] = None
    nodes: List[NodeData] = Field(default_factory=list)
    edges: List[EdgeData] = Field(default_factory=list)
    is_active: bool = True
    version: int = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @property
    def graph_data(self) -> Dict[str, Any]:
        """Преобразование в формат для сохранения в БД"""
        return {
            "nodes": [node.dict() for node in self.nodes],
            "edges": [edge.dict() for edge in self.edges],
            "version": self.version,
        }

    @classmethod
    def from_db_data(cls, db_graph) -> "GraphLogic":
        """Создание из данных БД"""
        graph_data = db_graph.graph_data or {}

        return cls(
            id=db_graph.id,
            user_id=db_graph.user_id,
            name=db_graph.name,
            description=db_graph.description,
            nodes=[NodeData(**node) for node in graph_data.get("nodes", [])],
            edges=[EdgeData(**edge) for edge in graph_data.get("edges", [])],
            is_active=db_graph.is_active,
            version=db_graph.version,
            created_at=db_graph.created_at,
            updated_at=db_graph.updated_at,
        )


class GraphExecutionLogic(BaseModel):
    """Логическая модель выполнения графа"""

    id: UUID = Field(default_factory=uuid.uuid4)
    graph_id: UUID
    user_id: UUID
    status: str = "pending"  # pending, running, completed, failed
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    error_data: Optional[Dict[str, Any]] = None
    execution_time_ms: Optional[int] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TelegramBotLogic(BaseModel):
    """Логическая модель телеграм бота"""

    id: UUID = Field(default_factory=uuid.uuid4)
    user_id: UUID
    name: str
    token: str
    username: Optional[str] = None
    description: Optional[str] = None
    webhook_url: Optional[str] = None
    is_active: bool = False
    job_status: Optional[str] = "STOPPED"  # BotJobStatus enum value
    graph_ids: List[UUID] = Field(default_factory=list)  # Связанные графы
    settings: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TelegramTriggerLogic(BaseModel):
    """Логическая модель триггера телеграм бота"""

    id: UUID = Field(default_factory=uuid.uuid4)
    bot_id: UUID
    graph_id: UUID
    user_id: UUID
    name: str
    trigger_type: str  # command, keyword, mention, callback
    trigger_pattern: str
    description: Optional[str] = None
    is_active: bool = True
    settings: Optional[Dict[str, Any]] = None
    priority: int = 100
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TelegramMessageQueueLogic(BaseModel):
    """Логическая модель очереди сообщений"""

    id: UUID = Field(default_factory=uuid.uuid4)
    bot_id: UUID
    user_id: UUID
    chat_id: int
    telegram_user_id: int
    message_data: Dict[str, Any]
    processing_status: str = "pending"  # pending, processing, completed, failed
    graph_execution_id: Optional[UUID] = None
    response_data: Optional[Dict[str, Any]] = None
    error_data: Optional[Dict[str, Any]] = None
    kafka_topic: Optional[str] = None
    kafka_partition: Optional[int] = None
    kafka_offset: Optional[int] = None
    processed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
