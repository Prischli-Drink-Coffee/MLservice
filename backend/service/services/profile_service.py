import logging
from uuid import UUID

from argon2 import PasswordHasher

from service.models.profile_models import UserProfileLogic
from service.repositories.profile_repository import ProfileRepository
from service.settings import ProfileConf

logger = logging.getLogger(__name__)


class ProfileService:
    def __init__(self, config: ProfileConf, repository: ProfileRepository) -> None:
        self.config = config
        self.repository = repository
        self.ph = PasswordHasher()

    async def fetch_user_profile(self, user_id: UUID) -> UserProfileLogic:
        logger.info(f"Fetching profile for user: {user_id}")

        user_profile = await self.repository.fetch_user_profile(str(user_id))
        if not user_profile:
            logger.error(f"User profile not found for user: {user_id}")
            raise ValueError("User profile not found")
        logger.debug(f"User profile: {user_profile}")

        return user_profile

    async def fetch_user_profile_by_email(self, email: str) -> UserProfileLogic | None:
        logger.info(f"Fetching profile for email: {email}")

        user_profile = await self.repository.fetch_user_by_email(email)
        if user_profile:
            logger.debug(f"User profile: {user_profile}")
        else:
            logger.debug(f"User profile not found for email: {email}")

        return user_profile

    async def create_new_user(self, email: str, password: str) -> UserProfileLogic:
        logger.info(f"Creating new user with email: {email}")
        password_hash = self.ph.hash(password)
        return await self.repository.create_user(
            email=email,
            password_hash=password_hash,
            base_available_launches=self.config.base_available_launches,
        )

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        try:
            return self.ph.verify(password_hash, password)
        except Exception:
            return False

    async def update_count_attempts(
        self, user_id: UUID, target_count_attempts: int
    ) -> UserProfileLogic:
        logger.info(f"Updating available_launches for user {user_id} to {target_count_attempts}")

        user_profile = await self.fetch_user_profile(user_id)
        user_profile.available_launches = target_count_attempts
        updated_profile = await self.repository.update_user_profile(user_profile)

        logger.info(
            f"Updated available_launches for user {user_id} to {updated_profile.available_launches}"
        )
        return updated_profile

    async def decrement_available_launches(self, user_id: UUID) -> int:
        user_profile = await self.fetch_user_profile(user_id)
        if user_profile.available_launches <= 0:
            logger.error(f"No available launches for user: {user_id}")
            raise ValueError("No available launches")
        user_profile.available_launches -= 1
        updated_profile = await self.repository.update_user_profile(user_profile)
        logger.info(
            f"Decremented available launches for user: {user_id}. New count: {updated_profile.available_launches}"
        )
        return updated_profile.available_launches

    async def increment_available_launches(self, user_id: UUID) -> int:
        user_profile = await self.fetch_user_profile(user_id)
        user_profile.available_launches += 1
        updated_profile = await self.repository.update_user_profile(user_profile)
        logger.info(
            f"Incremented available launches for user: {user_id}. New count: {updated_profile.available_launches}"
        )
        return updated_profile.available_launches
