import logging
from uuid import UUID

from service.repositories.stats_repository import StatsRepository

logger = logging.getLogger(__name__)


class StatsService:
    """Сервис для работы со статистикой"""

    def __init__(self, stats_repository: StatsRepository):
        self.stats_repository = stats_repository

    async def get_platform_statistics(self) -> dict:
        """
        Получить статистику по всей платформе

        Returns:
            dict: Словарь со статистикой платформы
        """
        logger.info("Fetching platform statistics")
        return await self.stats_repository.get_platform_stats()

    async def get_user_statistics(self, user_id: UUID) -> dict:
        """
        Получить статистику для конкретного пользователя

        Args:
            user_id: ID пользователя

        Returns:
            dict: Словарь со статистикой пользователя
        """
        logger.info(f"Fetching statistics for user {user_id}")
        return await self.stats_repository.get_user_stats(user_id)
