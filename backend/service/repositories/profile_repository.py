import logging

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from service.models.db.db_models import User
from service.models.profile_models import UserProfileLogic
from service.repositories.base_repository import BaseRepository
from service.repositories.decorators.session_processor import connection
from service.repositories.exceptions import RepositoryNotFoundError

logger = logging.getLogger(__name__)


class ProfileRepository(BaseRepository):

    @connection()
    async def create_user(
        self,
        email: str,
        password_hash: str,
        base_available_launches: int,
        session: AsyncSession | None = None,
    ) -> UserProfileLogic:

        new_user = User(
            email=email,
            password_hash=password_hash,
            available_launches=base_available_launches,
        )
        logger.debug(f"Creating entity: {new_user}")

        session.add(new_user)
        await session.flush()
        logger.debug(f"Entity created: {new_user}")

        return UserProfileLogic.model_validate(new_user)

    @connection()
    async def fetch_user_profile(
        self, user_id: str, session: AsyncSession | None = None
    ) -> UserProfileLogic | None:
        logger.debug(f"Fetching user profile by id: {user_id}")

        stmt = select(User).where(User.id == user_id)
        result = await session.execute(stmt)
        user_profile = result.scalar_one_or_none()

        if user_profile:
            user_profile = UserProfileLogic.model_validate(user_profile)
            logger.debug(f"Fetch result: {user_profile.model_dump_json(indent=4)}")
        else:
            logger.debug(f"User profile not found for: {user_id=}")
        return user_profile

    @connection()
    async def fetch_user_by_email(
        self, email: str, session: AsyncSession | None = None
    ) -> UserProfileLogic | None:
        logger.debug(f"Fetching user by email: {email}")

        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            user = UserProfileLogic.model_validate(user)
            logger.debug(f"Fetch result: {user.model_dump_json(indent=4)}")
        else:
            logger.debug(f"User not found for email: {email}")
        return user

    @connection()
    async def update_user_profile(
        self, user: UserProfileLogic, session: AsyncSession | None = None
    ) -> UserProfileLogic:
        logger.debug(f"Updating user profile: {user.model_dump_json(indent=4)}")

        payload = user.model_dump()
        phone_value: int | None
        if payload.get("phone") is None:
            phone_value = None
        else:
            digits = "".join(filter(str.isdigit, payload["phone"]))
            phone_value = int(digits) if digits else None

        update_values = {
            "email": payload["email"],
            "password_hash": payload["password_hash"],
            "first_name": payload.get("first_name"),
            "available_launches": payload["available_launches"],
            "phone": phone_value,
        }

        stmt = update(User).where(User.id == payload["id"]).values(**update_values).returning(User)
        result = await session.execute(stmt)
        db_user = result.scalar_one_or_none()

        if not db_user:
            raise RepositoryNotFoundError("User not found")

        updated_user = UserProfileLogic.model_validate(db_user)
        logger.debug(f"Updated user profile: {updated_user.model_dump_json(indent=4)}")
        return updated_user
