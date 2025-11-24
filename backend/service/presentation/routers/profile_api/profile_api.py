"""Profile API: user overview, updates, quota preview."""

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from service import container
from service.models.auth_models import AuthProfile
from service.models.profile_models import ProfileQuotaSnapshot, UserProfileLogic
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.profile_api.schemas import (
    ProfileQuotaResponse,
    ProfileResponse,
    ProfileUpdateRequest,
    QuotaPlanResponse,
)
from service.services.profile_service import ProfileService
from service.settings import config

logger = logging.getLogger(__name__)

profile_router = APIRouter(prefix="/api/profile")
billing_router = APIRouter(prefix="/api/billing")


def get_profile_service() -> ProfileService:
    return container.get(container.ProfileServiceName)


def _build_profile_response(
    service_result: tuple[UserProfileLogic, ProfileQuotaSnapshot]
) -> ProfileResponse:
    profile, quota = service_result
    phone = profile.phone
    if isinstance(phone, int):
        phone = str(phone)
    quota_payload = ProfileQuotaResponse(
        limit=quota.limit,
        used=quota.used,
        available=quota.available,
        resets_at=quota.resets_at,
    )

    permissions: list[str] = []
    if str(profile.id).lower() in config.admin_user_ids_set:
        permissions.append("datasets:cleanup")

    return ProfileResponse(
        id=profile.id,
        email=profile.email,
        first_name=profile.first_name,
        company=profile.company,
        timezone=profile.timezone,
        phone=phone,
        avatar_url=profile.avatar_url,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        quota=quota_payload,
        permissions=permissions,
    )


@profile_router.get("/me", response_model=ProfileResponse)
async def get_profile(
    auth_profile: Annotated[AuthProfile, Depends(check_auth)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> ProfileResponse:
    try:
        result = await service.get_profile_overview(auth_profile.user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return _build_profile_response(result)


@profile_router.patch("/me", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdateRequest,
    auth_profile: Annotated[AuthProfile, Depends(check_auth)],
    service: Annotated[ProfileService, Depends(get_profile_service)],
) -> ProfileResponse:
    try:
        await service.update_profile_details(
            auth_profile.user_id, payload.model_dump(exclude_unset=True)
        )
        overview = await service.get_profile_overview(auth_profile.user_id)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return _build_profile_response(overview)


contact_email = "payments@forge-incellcorp.ai"


@billing_router.get("/quotas/preview", response_model=list[QuotaPlanResponse])
async def quotas_preview() -> list[QuotaPlanResponse]:
    plans = [
        QuotaPlanResponse(
            id="starter",
            tokens=10,
            price=0,
            currency="USD",
            status="coming_soon",
            description="Базовый пакет для тестов",
            contact_email=contact_email,
        ),
        QuotaPlanResponse(
            id="growth",
            tokens=50,
            price=99,
            currency="USD",
            status="coming_soon",
            description="Подходит для команд и пилотов",
            contact_email=contact_email,
        ),
        QuotaPlanResponse(
            id="scale",
            tokens=150,
            price=249,
            currency="USD",
            status="coming_soon",
            description="Корпоративный пакет по запросу",
            contact_email=contact_email,
        ),
    ]

    return plans
