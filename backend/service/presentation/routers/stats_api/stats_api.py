import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from service import container
from service.models.auth_models import AuthProfile
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.stats_api.schemas import (
    PlatformStatsResponse,
    UserStatsResponse,
)

logger = logging.getLogger(__name__)

stats_router = APIRouter(prefix="/api/stats/v1", tags=["statistics"])

StatsServiceDep = Annotated[
    container.StatsServiceT, Depends(container.getter(container.StatsServiceName))
]


@stats_router.get(
    "/platform",
    response_model=PlatformStatsResponse,
    summary="Get platform statistics",
    description="Get platform-wide statistics: total users, bots, graphs, etc. (public endpoint)",
)
async def get_platform_stats(
    service: StatsServiceDep,
) -> PlatformStatsResponse:
    """Получить статистику по всей платформе (публичный эндпоинт)"""
    stats = await service.get_platform_statistics()
    return PlatformStatsResponse(**stats)


@stats_router.get(
    "/user",
    response_model=UserStatsResponse,
    summary="Get user statistics",
    description="Get statistics for the authenticated user",
)
async def get_user_stats(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    service: StatsServiceDep,
) -> UserStatsResponse:
    """Получить статистику для текущего пользователя"""
    stats = await service.get_user_statistics(profile.user_id)
    return UserStatsResponse(**stats)
