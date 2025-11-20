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
