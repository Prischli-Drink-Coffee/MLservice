import logging
from typing import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from service.settings import Postgresql

logger = logging.getLogger(__name__)


class PgConnector:
    _engine: AsyncEngine | None = None
    _session_maker: async_sessionmaker | None = None

    def __init__(self, config: Postgresql) -> None:
        self.config = config
        self._engine = self._get_engine()
        self._session_maker = self._get_session_maker()

    def _get_engine(self) -> AsyncEngine:
        if not PgConnector._engine:
            PgConnector._engine = create_async_engine(
                self.config.dsn,
                echo=self.config.db_echo,
                echo_pool=self.config.db_echo,
                pool_size=self.config.db_pool_size,
                max_overflow=self.config.db_max_overflow,
                pool_timeout=self.config.db_pool_timeout,
                pool_recycle=self.config.db_pool_recycle,
                pool_pre_ping=self.config.db_pool_pre_ping,
                future=True,
            )
        return PgConnector._engine

    def _get_session_maker(self) -> async_sessionmaker:
        if not PgConnector._session_maker:
            PgConnector._session_maker = async_sessionmaker(
                bind=self._engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=False,
            )
        return PgConnector._session_maker

    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get database session for use as FastAPI dependency"""
        if self._session_maker is None:
            logger.error("Attempted to get session but sessionmaker is not initialized")
            raise ValueError("PostgreSQL sessionmaker is not initialized")

        logger.debug("Creating new database session")
        try:
            async with self._session_maker() as session:
                logger.debug("Database session created successfully")
                yield session
                logger.debug("Database session closed successfully")
        except Exception as e:
            logger.exception(f"Error managing database session: {e}")
            raise

    def get_session_context(self) -> AsyncSession:
        """Returns context manager for use outside FastAPI dependency injection."""
        if self._session_maker is None:
            logger.error("Attempted to get session context but sessionmaker is not initialized")
            raise ValueError("PostgreSQL sessionmaker is not initialized")

        logger.debug("Creating database session context")
        return self._session_maker()

    async def verify_connection(self) -> None:
        """Open a short session and execute a trivial statement to verify connectivity."""
        if self._engine is None:
            raise ValueError("PostgreSQL engine is not initialized")
        try:
            async with self.get_session_context() as session:
                await session.execute(text("SELECT 1"))
                await session.commit()
            logger.debug("PostgreSQL connection verified successfully")
        except Exception as e:
            logger.exception("Failed to verify PostgreSQL connection: %s", e)
            raise

    async def close(self) -> None:
        """Dispose engine connections gracefully."""
        try:
            if self._engine is not None:
                await self._engine.dispose()
                logger.debug("PostgreSQL engine disposed")
        except Exception as e:
            logger.exception("Error disposing PostgreSQL engine: %s", e)
