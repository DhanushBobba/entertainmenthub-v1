from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


BookingType = Literal["movie", "event"]

BookingStatus = Literal[
    "pending",
    "confirmed",
    "cancelled",
    "completed"
]


class BookingCreate(BaseModel):
    booking_type: BookingType
    item_id: UUID
    quantity: int = Field(default=1, ge=1, le=10)


class BookingStatusUpdate(BaseModel):
    booking_status: Literal[
        "confirmed",
        "cancelled",
        "completed"
    ]