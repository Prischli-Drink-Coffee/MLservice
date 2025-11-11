import logging
from typing import TYPE_CHECKING
from uuid import UUID

from argon2 import PasswordHasher

from service.models.profile_models import UserProfileLogic
from service.repositories.profile_repository import ProfileRepository
from service.settings import ProfileConf

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from service.infrastructure.cache.redis_cache import RedisCacheService


PROFILE_BY_ID_NAMESPACE = "profile:id"
PROFILE_BY_EMAIL_NAMESPACE = "profile:email"


class ProfileService:
    def __init__(
        self,
        config: ProfileConf,
        repository: ProfileRepository,
        cache: "RedisCacheService | None" = None,
        cache_ttl_seconds: int | None = None,
    ) -> None:
        self.config = config
        self.repository = repository
        self.ph = PasswordHasher()
        self.cache = cache
        self._cache_ttl_seconds = cache_ttl_seconds

    async def _cache_profile(self, profile: UserProfileLogic) -> None:
        if not self.cache:
            return
        payload = profile.model_dump()
        await self.cache.set_json(
            PROFILE_BY_ID_NAMESPACE,
            str(profile.id),
            payload,
            ttl_seconds=self._cache_ttl_seconds,
        )
        await self.cache.set_json(
            PROFILE_BY_EMAIL_NAMESPACE,
            profile.email.lower(),
            payload,
            ttl_seconds=self._cache_ttl_seconds,
        )

    async def _get_cached_profile_by_id(self, user_id: UUID) -> UserProfileLogic | None:
        if not self.cache:
            return None
        cached = await self.cache.get_json(PROFILE_BY_ID_NAMESPACE, str(user_id))
        if not cached:
            return None
        try:
            return UserProfileLogic.model_validate(cached)
        except Exception:  # noqa: BLE001
            logger.warning("Invalid cached profile for user_id=%s; purging", user_id)
            await self.cache.invalidate(PROFILE_BY_ID_NAMESPACE, str(user_id))
            return None

    async def _get_cached_profile_by_email(self, email: str) -> UserProfileLogic | None:
        if not self.cache:
            return None
        cache_key = email.lower()
        cached = await self.cache.get_json(PROFILE_BY_EMAIL_NAMESPACE, cache_key)
        if not cached:
            return None
        try:
            return UserProfileLogic.model_validate(cached)
        except Exception:  # noqa: BLE001
            logger.warning("Invalid cached profile for email=%s; purging", email)
            await self.cache.invalidate(PROFILE_BY_EMAIL_NAMESPACE, cache_key)
            return None

    async def _invalidate_profile_cache(self, user_id: UUID, email: str) -> None:
        if not self.cache:
            return
        await self.cache.invalidate(PROFILE_BY_ID_NAMESPACE, str(user_id))
        await self.cache.invalidate(PROFILE_BY_EMAIL_NAMESPACE, email.lower())

    async def _refresh_profile_cache(
        self, profile: UserProfileLogic, previous_email: str | None = None
    ) -> None:
        if not self.cache:
            return
        if previous_email and previous_email.lower() != profile.email.lower():
            await self.cache.invalidate(PROFILE_BY_EMAIL_NAMESPACE, previous_email.lower())
        await self._cache_profile(profile)

    async def fetch_user_profile(self, user_id: UUID) -> UserProfileLogic:
        logger.info(f"Fetching profile for user: {user_id}")

        cached_profile = await self._get_cached_profile_by_id(user_id)
        if cached_profile:
            logger.debug("Profile cache hit for user_id=%s", user_id)
            return cached_profile

        user_profile = await self.repository.fetch_user_profile(str(user_id))
        if not user_profile:
            logger.error(f"User profile not found for user: {user_id}")
            raise ValueError("User profile not found")
        logger.debug(f"User profile: {user_profile}")

        await self._cache_profile(user_profile)

        return user_profile

    async def fetch_user_profile_by_email(self, email: str) -> UserProfileLogic | None:
        logger.info(f"Fetching profile for email: {email}")

        cached_profile = await self._get_cached_profile_by_email(email)
        if cached_profile:
            logger.debug("Profile cache hit for email=%s", email)
            return cached_profile

        user_profile = await self.repository.fetch_user_by_email(email)
        if user_profile:
            logger.debug(f"User profile: {user_profile}")
            await self._cache_profile(user_profile)
        else:
            logger.debug(f"User profile not found for email: {email}")

        return user_profile

    async def create_new_user(self, email: str, password: str) -> UserProfileLogic:
        logger.info(f"Creating new user with email: {email}")
        password_hash = self.ph.hash(password)
        new_user = await self.repository.create_user(
            email=email,
            password_hash=password_hash,
            base_available_launches=self.config.base_available_launches,
        )
        await self._cache_profile(new_user)
        return new_user

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
        previous_email = user_profile.email
        user_profile.available_launches = target_count_attempts
        updated_profile = await self.repository.update_user_profile(user_profile)
        await self._refresh_profile_cache(updated_profile, previous_email)

        logger.info(
            f"Updated available_launches for user {user_id} to {updated_profile.available_launches}"
        )
        return updated_profile

    async def decrement_available_launches(self, user_id: UUID) -> int:
        user_profile = await self.fetch_user_profile(user_id)
        previous_email = user_profile.email
        if user_profile.available_launches <= 0:
            logger.error(f"No available launches for user: {user_id}")
            raise ValueError("No available launches")
        user_profile.available_launches -= 1
        updated_profile = await self.repository.update_user_profile(user_profile)
        await self._refresh_profile_cache(updated_profile, previous_email)
        logger.info(
            f"Decremented available launches for user: {user_id}. New count: {updated_profile.available_launches}"
        )
        return updated_profile.available_launches

    async def increment_available_launches(self, user_id: UUID) -> int:
        user_profile = await self.fetch_user_profile(user_id)
        previous_email = user_profile.email
        user_profile.available_launches += 1
        updated_profile = await self.repository.update_user_profile(user_profile)
        await self._refresh_profile_cache(updated_profile, previous_email)
        logger.info(
            f"Incremented available launches for user: {user_id}. New count: {updated_profile.available_launches}"
        )
        return updated_profile.available_launches
