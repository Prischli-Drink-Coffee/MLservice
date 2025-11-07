import logging
from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from service.models.db.db_models import Graph, GraphExecution, TelegramBot, User
from service.repositories.base_repository import BaseRepository
from service.repositories.decorators.session_processor import connection

logger = logging.getLogger(__name__)


class StatsRepository(BaseRepository):
    """Репозиторий для работы со статистикой"""

    @connection()
    async def get_platform_stats(self, session: AsyncSession | None = None) -> dict:
        """Получить статистику по всей платформе"""
        logger.debug("Getting platform statistics")

        # Count total users
        users_result = await session.execute(select(func.count(User.id)))
        total_users = users_result.scalar() or 0

        # Count total and active bots
        bots_total_result = await session.execute(select(func.count(TelegramBot.id)))
        total_bots = bots_total_result.scalar() or 0

        bots_active_result = await session.execute(
            select(func.count(TelegramBot.id)).where(TelegramBot.is_active == True)
        )
        active_bots = bots_active_result.scalar() or 0

        # Count total and active graphs
        graphs_total_result = await session.execute(select(func.count(Graph.id)))
        total_graphs = graphs_total_result.scalar() or 0

        graphs_active_result = await session.execute(
            select(func.count(Graph.id)).where(Graph.is_active == True)
        )
        active_graphs = graphs_active_result.scalar() or 0

        return {
            "total_users": total_users,
            "total_bots": total_bots,
            "active_bots": active_bots,
            "total_graphs": total_graphs,
            "active_graphs": active_graphs,
        }

    @connection()
    async def get_user_stats(self, user_id: UUID, session: AsyncSession | None = None) -> dict:
        """Получить статистику для конкретного пользователя"""
        logger.debug(f"Getting statistics for user {user_id}")

        # Count user's bots
        bots_total_result = await session.execute(
            select(func.count(TelegramBot.id)).where(TelegramBot.user_id == user_id)
        )
        total_bots = bots_total_result.scalar() or 0

        bots_active_result = await session.execute(
            select(func.count(TelegramBot.id)).where(
                TelegramBot.user_id == user_id, TelegramBot.is_active == True
            )
        )
        active_bots = bots_active_result.scalar() or 0

        # Count user's graphs
        graphs_total_result = await session.execute(
            select(func.count(Graph.id)).where(Graph.user_id == user_id)
        )
        total_graphs = graphs_total_result.scalar() or 0

        graphs_active_result = await session.execute(
            select(func.count(Graph.id)).where(Graph.user_id == user_id, Graph.is_active == True)
        )
        active_graphs = graphs_active_result.scalar() or 0

        # Count graph executions
        # Join with graphs to filter by user
        executions_total_result = await session.execute(
            select(func.count(GraphExecution.id))
            .select_from(GraphExecution)
            .join(Graph, Graph.id == GraphExecution.graph_id)
            .where(Graph.user_id == user_id)
        )
        total_executions = executions_total_result.scalar() or 0

        executions_success_result = await session.execute(
            select(func.count(GraphExecution.id))
            .select_from(GraphExecution)
            .join(Graph, Graph.id == GraphExecution.graph_id)
            .where(Graph.user_id == user_id, GraphExecution.status == "completed")
        )
        successful_executions = executions_success_result.scalar() or 0

        executions_failed_result = await session.execute(
            select(func.count(GraphExecution.id))
            .select_from(GraphExecution)
            .join(Graph, Graph.id == GraphExecution.graph_id)
            .where(Graph.user_id == user_id, GraphExecution.status == "failed")
        )
        failed_executions = executions_failed_result.scalar() or 0

        return {
            "user_id": str(user_id),
            "total_bots": total_bots,
            "active_bots": active_bots,
            "total_graphs": total_graphs,
            "active_graphs": active_graphs,
            "total_executions": total_executions,
            "successful_executions": successful_executions,
            "failed_executions": failed_executions,
        }
