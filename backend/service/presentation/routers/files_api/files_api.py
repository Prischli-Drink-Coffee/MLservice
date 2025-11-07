import logging
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, UploadFile, status
from pydantic import BaseModel

from service import container
from service.models.auth_models import AuthProfile
from service.models.key_value import Languages, ServiceMode
from service.presentation.dependencies.auth_checker import check_auth
from service.presentation.routers.files_api.schemas import (
    FetchModesResponse,
    FetchUserFilesResponse,
    UploadResponse,
)
from service.settings import config

logger = logging.getLogger(__name__)
files_router = APIRouter(prefix="/api/service")


@files_router.get("/ping", deprecated=True)
async def ping_handler():
    logger.info("Ping")
    return "Pong"


@files_router.get(
    "/files/v1/modes",
    summary="(Beta) Get available service modes",
    description="Get available service modes.",
    response_model=FetchModesResponse,
)
async def fetch_available_modes(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    lang: Annotated[Languages | None, Query(title="Language")] = Languages.RU,
) -> FetchModesResponse:
    return FetchModesResponse(modes=[mode for mode in ServiceMode])


@files_router.get(
    path="/files/v1/fetch/{mode}",
    summary="Fetch user photos metadata",
    description="Fetch metadata of all user photos.",
    response_model=FetchUserFilesResponse,
)
async def fetch_handler(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    mode: Annotated[ServiceMode, Path(...)],
    service: Annotated[
        container.FileSaverServiceT,
        Depends(container.getter(container.FileSaverServiceName)),
    ],
) -> FetchUserFilesResponse:
    user_files = await service.fetch_all_user_files(profile.user_id, mode)
    return user_files


@files_router.post(
    "/files/v1/upload/{mode}",
    summary="Upload user photo",
    description=f"Only: {config.allowed_extensions} format allowed.",
    response_model=UploadResponse,
)
async def upload_handler(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    mode: Annotated[ServiceMode, Path(...)],
    file: UploadFile,
    service: Annotated[
        container.FileSaverServiceT,
        Depends(container.getter(container.FileSaverServiceName)),
    ],
) -> UploadResponse:
    if file_name := file.filename:
        if not any(file_name.endswith(ext) for ext in config.allowed_extensions):
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file extension. Only: {config.allowed_extensions} allowed.",
            )

        content = await file.read()
        if len(content) > config.max_file_size_byte:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Max size: {config.max_file_size_byte} bytes.",
            )
        response = await service.save(
            user_id=profile.user_id,
            mode=mode,
            file_name=file_name,
            file_content=content,
        )
        return response
    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty filename")


@files_router.delete("/files/v1/delete/{file_id}")
async def delete_handler(
    profile: Annotated[AuthProfile, Depends(check_auth)],
    file_id: Annotated[UUID, Path(..., title="File ID")],
    service: Annotated[
        container.FileSaverServiceT,
        Depends(container.getter(container.FileSaverServiceName)),
    ],
) -> None:
    await service.delete(
        user_id=profile.user_id,
        file_id=file_id,
    )


class ModifyResponse(BaseModel):
    job_id: str


@files_router.post("/jobs/v1/start", deprecated=True)
async def start_processing_job(template_id: str) -> str:
    # Simulate starting a long-running job
    return "some-job-id"


@files_router.post("/modify/lips", deprecated=True)
async def modify_lips_handler(
    template_id: str,
) -> ModifyResponse:
    return {
        "job_id": "some-job-id",
    }


class GetJobResponse(BaseModel):
    is_done: bool
    file_ids: List[str]


@files_router.get("/jobs/{job_id}", deprecated=True)
async def get_job_result_handler(
    job_id: str,
) -> GetJobResponse:
    return {
        "is_done": False,
        "file_ids": [],
    }


class TemplatesLipsResponseItem(BaseModel):
    name: str
    label: str


TemplatesLipsResponse = List[TemplatesLipsResponseItem]


@files_router.get("/templates/lips", deprecated=True)
async def tempaltes_lips_handler() -> TemplatesLipsResponse:
    return [
        {"name": "paris", "label": "Парижские"},
    ]


class RemainingTokensResponse(BaseModel):
    qty: int


@files_router.get("/user/remaining_tokens", deprecated=True)
async def remaining_tokens_handler() -> RemainingTokensResponse:
    return {"qty": 5}
