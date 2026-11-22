from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from postgrest.exceptions import APIError

from app.core.database import get_supabase_admin
from app.dependencies.auth import (
    get_current_user,
    require_admin,
    require_customer
)
from app.schemas.booking import (
    BookingCreate,
    BookingStatusUpdate,
    BookingStatus,
    BookingType
)


router = APIRouter(
    prefix="/bookings",
    tags=["Bookings"]
)


BOOKING_SELECT = """
    *,
    profiles(id, full_name, email),
    movies(id, title, poster_url, language),
    events(id, title, banner_url, venue, city, event_date, event_time)
"""


@router.post("/", status_code=201)
def create_booking(
    payload: BookingCreate,
    customer: dict = Depends(require_customer)
):
    try:
        result = (
            get_supabase_admin()
            .rpc(
                "create_booking",
                {
                    "p_user_id": customer["id"],
                    "p_booking_type": payload.booking_type,
                    "p_item_id": str(payload.item_id),
                    "p_quantity": payload.quantity
                }
            )
            .execute()
        )

    except APIError as exc:
        errors = {
            "INVALID_QUANTITY": "Invalid ticket quantity",
            "INVALID_CUSTOMER": "Invalid customer account",
            "MOVIE_NOT_AVAILABLE": "Movie is not available",
            "EVENT_NOT_AVAILABLE": "Event is not available",
            "INSUFFICIENT_SEATS": "Not enough seats available",
            "INVALID_BOOKING_TYPE": "Invalid booking type"
        }

        for key, message in errors.items():
            if key in str(exc):
                raise HTTPException(
                    status_code=409,
                    detail=message
                )

        raise HTTPException(
            status_code=500,
            detail="Unable to create booking"
        )

    booking = result.data

    if isinstance(booking, list):
        booking = booking[0] if booking else None

    if not booking:
        raise HTTPException(
            status_code=500,
            detail="Booking creation failed"
        )

    return {
        "message": "Booking created successfully",
        "booking": booking
    }


@router.get("/")
def get_bookings(
    booking_type: BookingType | None = None,
    booking_status: BookingStatus | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    query = (
        get_supabase_admin()
        .table("bookings")
        .select(BOOKING_SELECT, count="exact")
    )

    if current_user["role"] != "admin":
        query = query.eq("user_id", current_user["id"])

    if booking_type:
        query = query.eq("booking_type", booking_type)

    if booking_status:
        query = query.eq("booking_status", booking_status)

    start = (page - 1) * limit

    result = (
        query
        .order("created_at", desc=True)
        .range(start, start + limit - 1)
        .execute()
    )

    return {
        "total": result.count or 0,
        "page": page,
        "limit": limit,
        "bookings": result.data
    }


@router.get("/{booking_id}")
def get_booking(
    booking_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    query = (
        get_supabase_admin()
        .table("bookings")
        .select(BOOKING_SELECT)
        .eq("id", str(booking_id))
    )

    if current_user["role"] != "admin":
        query = query.eq("user_id", current_user["id"])

    result = query.limit(1).execute()

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    return result.data[0]


@router.patch("/{booking_id}/status")
def update_booking_status(
    booking_id: UUID,
    payload: BookingStatusUpdate,
    admin: dict = Depends(require_admin)
):
    client = get_supabase_admin()

    existing = (
        client.table("bookings")
        .select("*")
        .eq("id", str(booking_id))
        .limit(1)
        .execute()
    )

    if not existing.data:
        raise HTTPException(
            status_code=404,
            detail="Booking not found"
        )

    booking = existing.data[0]

    current_status = booking["booking_status"]
    new_status = payload.booking_status

    allowed_transitions = {
        "pending": ["confirmed", "cancelled"],
        "confirmed": ["completed", "cancelled"],
        "completed": [],
        "cancelled": []
    }

    if new_status not in allowed_transitions.get(
        current_status, []
    ):
        raise HTTPException(
            status_code=409,
            detail="Invalid booking status transition"
        )

    if (
        new_status == "cancelled"
        and booking["payment_status"] == "paid"
    ):
        raise HTTPException(
            status_code=409,
            detail="Paid bookings require refund processing"
        )

    result = (
        client.table("bookings")
        .update({"booking_status": new_status})
        .eq("id", str(booking_id))
        .eq("booking_status", current_status)
        .eq("payment_status", booking["payment_status"])
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=409,
            detail="Booking status changed. Please refresh."
        )

    return {
        "message": "Booking status updated successfully",
        "booking": result.data[0]
    }


@router.patch("/{booking_id}/cancel")
def cancel_booking(
    booking_id: UUID,
    customer: dict = Depends(require_customer)
):
    result = (
        get_supabase_admin()
        .table("bookings")
        .update({"booking_status": "cancelled"})
        .eq("id", str(booking_id))
        .eq("user_id", customer["id"])
        .in_("booking_status", ["pending", "confirmed"])
        .in_("payment_status", ["pending", "failed"])
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=409,
            detail="Booking not found or cannot be cancelled"
        )

    return {
        "message": "Booking cancelled successfully",
        "booking": result.data[0]
    }