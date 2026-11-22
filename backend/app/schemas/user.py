from pydantic import BaseModel, Field


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserProfileUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=100
    )

    phone: str | None = Field(
        default=None,
        max_length=20
    )