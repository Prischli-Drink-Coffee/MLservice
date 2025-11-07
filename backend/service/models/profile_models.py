from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserProfileLogic(BaseModel):
    id: UUID
    email: str
    password_hash: str
    phone: str | None
    first_name: str | None
    available_launches: int
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
