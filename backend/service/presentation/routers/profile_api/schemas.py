from datetime import datetime
from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl, model_validator


class ProfileQuotaResponse(BaseModel):
    limit: Annotated[int, Field(ge=0)]
    used: Annotated[int, Field(ge=0)]
    available: Annotated[int, Field(ge=0)]
    resets_at: datetime | None = None


class ProfileResponse(BaseModel):
    id: UUID
    email: EmailStr
    first_name: str | None = None
    company: str | None = None
    timezone: str | None = None
    phone: str | None = None
    avatar_url: HttpUrl | str | None = None
    created_at: datetime
    updated_at: datetime | None = None
    quota: ProfileQuotaResponse
    permissions: list[str] = Field(default_factory=list)


class ProfileUpdateRequest(BaseModel):
    first_name: Annotated[str | None, Field(None, min_length=1, max_length=50)] = None
    company: Annotated[str | None, Field(None, min_length=1, max_length=255)] = None
    timezone: Annotated[str | None, Field(None, min_length=1, max_length=50)] = None
    phone: Annotated[str | None, Field(None, min_length=7, max_length=20)] = None
    avatar_url: Annotated[str | None, Field(None, max_length=1000)] = None

    @model_validator(mode="after")
    def _ensure_payload(self) -> "ProfileUpdateRequest":
        if not self.model_fields_set:
            raise ValueError("At least one field must be provided for update")
        return self


class QuotaPlanResponse(BaseModel):
    id: str
    tokens: int
    price: float
    currency: str
    status: str
    description: str
    contact_email: EmailStr
