import logging
from typing import List, Optional
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.service.models.ml_models import GraphExecutionLogic, GraphLogic
from service.models.db.db_models import Graph, GraphExecution
from service.repositories.base_repository import BaseRepository
from service.repositories.decorators.session_processor import connection

logger = logging.getLogger(__name__)


class GraphRepository(BaseRepository):
    """Репозиторий для работы с графами"""

    @connection()
    async def create_graph(
        self, graph: GraphLogic, session: AsyncSession | None = None
    ) -> GraphLogic:
        """Создать новый граф"""
        logger.debug(f"Creating graph: {graph.name}")

        db_graph = Graph(
            user_id=graph.user_id,
            name=graph.name,
            description=graph.description,
            graph_data=graph.graph_data,
            is_active=graph.is_active,
            version=graph.version,
        )

        session.add(db_graph)
        await session.flush()

        return GraphLogic.from_db_data(db_graph)

    @connection()
    async def get_graph_by_id(
        self, user_id: UUID, graph_id: UUID, session: AsyncSession | None = None
    ) -> Optional[GraphLogic]:
        """Получить граф по ID"""
        logger.debug(f"Getting graph {graph_id} for user {user_id}")

        stmt = select(Graph).where(Graph.id == graph_id, Graph.user_id == user_id)
        result = await session.execute(stmt)
        db_graph = result.scalar_one_or_none()

        if not db_graph:
            return None

        return GraphLogic.from_db_data(db_graph)

    @connection()
    async def list_user_graphs(
        self,
        user_id: UUID,
        offset: int = 0,
        limit: int = 20,
        active_only: bool = True,
        session: AsyncSession | None = None,
    ) -> tuple[List[GraphLogic], int]:
        """Получить список графов пользователя с пагинацией"""
        logger.debug(f"Listing graphs for user {user_id}, offset={offset}, limit={limit}")

        # Построить базовый запрос
        base_stmt = select(Graph).where(Graph.user_id == user_id)

        if active_only:
            base_stmt = base_stmt.where(Graph.is_active == True)

        # Получить общее количество (без cartesian product)
        subq = base_stmt.subquery()
        count_stmt = select(func.count()).select_from(subq)
        count_result = await session.execute(count_stmt)
        total = count_result.scalar_one()

        # Получить данные с пагинацией
        stmt = base_stmt.offset(offset).limit(limit).order_by(Graph.updated_at.desc())
        result = await session.execute(stmt)
        db_graphs = result.scalars().all()

        graphs = [GraphLogic.from_db_data(graph) for graph in db_graphs]
        return graphs, total

    @connection()
    async def update_graph(
        self, user_id: UUID, graph_id: UUID, updates: dict, session: AsyncSession | None = None
    ) -> Optional[GraphLogic]:
        """Обновить граф"""
        logger.debug(f"Updating graph {graph_id} for user {user_id}")

        stmt = (
            update(Graph)
            .where(Graph.id == graph_id, Graph.user_id == user_id)
            .values(**updates)
            .returning(Graph)
        )

        result = await session.execute(stmt)
        db_graph = result.scalar_one_or_none()

        if not db_graph:
            return None

        return GraphLogic.from_db_data(db_graph)

    @connection()
    async def delete_graph(
        self, user_id: UUID, graph_id: UUID, session: AsyncSession | None = None
    ) -> bool:
        """Удалить граф"""
        logger.debug(f"Deleting graph {graph_id} for user {user_id}")

        stmt = delete(Graph).where(Graph.id == graph_id, Graph.user_id == user_id)

        result = await session.execute(stmt)
        return result.rowcount > 0

    @connection()
    async def create_execution(
        self, execution: GraphExecutionLogic, session: AsyncSession | None = None
    ) -> GraphExecutionLogic:
        """Создать новое выполнение графа"""
        logger.debug(f"Creating execution for graph {execution.graph_id}")

        db_execution = GraphExecution(
            graph_id=execution.graph_id,
            user_id=execution.user_id,
            status=execution.status,
            input_data=execution.input_data,
            output_data=execution.output_data,
            error_data=execution.error_data,
            execution_time_ms=execution.execution_time_ms,
            started_at=execution.started_at,
            completed_at=execution.completed_at,
        )

        session.add(db_execution)
        await session.flush()

        return GraphExecutionLogic.model_validate(db_execution)

    @connection()
    async def get_execution_by_id(
        self, user_id: UUID, execution_id: UUID, session: AsyncSession | None = None
    ) -> Optional[GraphExecutionLogic]:
        """Получить выполнение по ID"""
        logger.debug(f"Getting execution {execution_id} for user {user_id}")

        stmt = select(GraphExecution).where(
            GraphExecution.id == execution_id, GraphExecution.user_id == user_id
        )
        result = await session.execute(stmt)
        db_execution = result.scalar_one_or_none()

        if not db_execution:
            return None

        return GraphExecutionLogic.model_validate(db_execution)

    @connection()
    async def list_graph_executions(
        self, user_id: UUID, graph_id: UUID, limit: int = 20, session: AsyncSession | None = None
    ) -> List[GraphExecutionLogic]:
        """Получить список выполнений графа"""
        logger.debug(f"Listing executions for graph {graph_id}, user {user_id}")

        stmt = (
            select(GraphExecution)
            .where(GraphExecution.graph_id == graph_id, GraphExecution.user_id == user_id)
            .order_by(GraphExecution.created_at.desc())
            .limit(limit)
        )

        result = await session.execute(stmt)
        db_executions = result.scalars().all()

        return [GraphExecutionLogic.model_validate(execution) for execution in db_executions]

    @connection()
    async def update_execution(
        self, user_id: UUID, execution_id: UUID, updates: dict, session: AsyncSession | None = None
    ) -> Optional[GraphExecutionLogic]:
        """Обновить выполнение графа"""
        logger.debug(f"Updating execution {execution_id} for user {user_id}")

        stmt = (
            update(GraphExecution)
            .where(GraphExecution.id == execution_id, GraphExecution.user_id == user_id)
            .values(**updates)
            .returning(GraphExecution)
        )

        result = await session.execute(stmt)
        db_execution = result.scalar_one_or_none()

        if not db_execution:
            return None

        return GraphExecutionLogic.model_validate(db_execution)
