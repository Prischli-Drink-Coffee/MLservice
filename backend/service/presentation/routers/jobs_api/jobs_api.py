import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, Path

from service import container
from service.models.auth_models import AuthProfile
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.jobs_api.schemas import JobResponse, StartJobRequest

# from service.settings import config  # not used here, left for future extensions

logger = logging.getLogger(__name__)
jobs_router = APIRouter(prefix="/api/jobs/v1")


@jobs_router.post(
    "/start",
    summary="Start a modify job",
    response_model=JobResponse,
)
async def start_processing_job(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    request_body: Annotated[StartJobRequest, Body()],
    service: Annotated[container.JobServiceT, Depends(container.getter(container.JobServiceName))],
) -> JobResponse:

    return await service.create_job(profile.user_id, request_body)


@jobs_router.get(
    "/result/{job_id}",
    summary="Fetch the result of a modify job",
    response_model=JobResponse,
)
async def fetch_result(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    job_id: Annotated[str, Path(...)],
    service: Annotated[container.JobServiceT, Depends(container.getter(container.JobServiceName))],
) -> JobResponse:

    return await service.fetch_job_result(profile.user_id, UUID(job_id))
