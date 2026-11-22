from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


MovieStatus = Literal[
    "upcoming",
    "now_showing",
    "completed",
    "inactive"
]


class MovieCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    category_id: UUID | None = None
    description: str | None = None
    language: str | None = None
    duration_minutes: int | None = Field(default=None, gt=0)
    release_date: date | None = None
    director: str | None = None
    cast_members: str | None = None
    poster_url: str | None = None
    trailer_url: str | None = None

    ticket_price: Decimal = Field(
        default=0,
        ge=0,
        max_digits=10,
        decimal_places=2
    )

    status: MovieStatus = "upcoming"


class MovieUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    category_id: UUID | None = None
    description: str | None = None
    language: str | None = None
    duration_minutes: int | None = Field(default=None, gt=0)
    release_date: date | None = None
    director: str | None = None
    cast_members: str | None = None
    poster_url: str | None = None
    trailer_url: str | None = None

    ticket_price: Decimal | None = Field(
        default=None,
        ge=0,
        max_digits=10,
        decimal_places=2
    )

    status: MovieStatus | None = None