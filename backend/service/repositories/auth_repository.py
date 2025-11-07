import logging
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from service.models.db.db_models import User, UserSession
from service.repositories.base_repository import BaseRepository
from service.repositories.decorators.session_processor import connection

logger = logging.getLogger(__name__)


class AuthRepository(BaseRepository):

    @connection()
    async def create_session(
        self,
        user_session: UserSession,
        session: AsyncSession | None = None,
    ) -> UserSession:

        # Clean up any existing sessions for this user
        stmt = (
            select(UserSession.id)
            .where(UserSession.user_id == user_session.user_id)
            .with_for_update(skip_locked=True)
        )
        result = await session.execute(stmt)
        sessions_to_delete = result.scalars().all()

        if sessions_to_delete:
            logger.info(
                f"User already has sessions, deleting {len(sessions_to_delete)} old sessions"
            )

            del_stmt = delete(UserSession).where(UserSession.id.in_(sessions_to_delete))
            await session.execute(del_stmt)

        logger.debug(f"Creating new session: {user_session}")
        session.add(instance=user_session)
        await session.flush()
        logger.debug(f"Session created: {user_session}")
        return user_session

    @connection()
    async def update_session(
        self, user_session: UserSession, session: AsyncSession | None = None
    ) -> UserSession:
        logger.debug(f"Updating session: {user_session}")
        await session.merge(user_session)
        await session.flush()
        logger.debug(f"Session updated: {user_session}")
        return user_session
