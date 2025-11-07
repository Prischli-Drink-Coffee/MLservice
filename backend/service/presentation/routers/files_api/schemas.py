from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field

from service.models.key_value import ServiceMode


class FileMetadata(BaseModel):
    file_id: Annotated[UUID, Field(..., description="Unique file identifier")]
    file_url: Annotated[str, Field(..., description="URL to access the file")]


class UploadResponse(FileMetadata):
    pass


class FetchUserFilesResponse(BaseModel):
    files: Annotated[list[FileMetadata], Field(..., description="List of user's uploaded files")]


class FetchModesResponse(BaseModel):
    modes: Annotated[
        list[ServiceMode], Field(..., description="Available service processing modes")
    ]
