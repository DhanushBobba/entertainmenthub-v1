from datetime import date, time
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


EventStatus = Literal[
    "upcoming",
    "ongoing",
    "completed",
    "cancelled"
]


class EventCreate(BaseModel):
    category_id: UUID | None = None
    title: str = Field(min_length=2, max_length=200)
    description: str | None = None
    venue: str = Field(min_length=2, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    organizer: str | None = None

    event_date: date
    event_time: time

    banner_url: str | None = None

    ticket_price: Decimal = Field(
        default=0,
        ge=0,
        max_digits=10,
        decimal_places=2
    )

    total_seats: int = Field(gt=0)
    status: EventStatus = "upcoming"


class EventUpdate(BaseModel):
    category_id: UUID | None = None
    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=200
    )
    description: str | None = None
    venue: str | None = None
    city: str | None = None
    organizer: str | None = None

    event_date: date | None = None
    event_time: time | None = None

    banner_url: str | None = None

    ticket_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=10,
        decimal_places=2
    )

    total_seats: int | None = Field(
        default=None,
        gt=0
    )

    status: EventStatus | None = None