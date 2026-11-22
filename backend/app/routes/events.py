from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query
)

from app.core.database import get_supabase_admin

from app.dependencies.auth import (
    get_current_user,
    require_admin
)

from app.schemas.event import (
    EventCreate,
    EventUpdate,
    EventStatus
)


router = APIRouter(
    prefix="/events",
    tags=["Events"]
)


# =====================================================
# VALIDATE CATEGORY
# =====================================================

def validate_category(category_id):

    if category_id is None:
        return

    result = (
        get_supabase_admin()
        .table("categories")
        .select("id")
        .eq("id", str(category_id))
        .eq("is_active", True)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=400,
            detail="Invalid or inactive category"
        )


# =====================================================
# GET ALL EVENTS
# =====================================================

@router.get("/")
def get_events(
    search: str | None = None,
    city: str | None = None,
    status: EventStatus | None = None,
    category_id: UUID | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):

    query = (
        get_supabase_admin()
        .table("events")
        .select(
            "*, categories(id, name)",
            count="exact"
        )
    )

    if current_user["role"] != "admin":
        query = query.in_(
            "status",
            ["upcoming", "ongoing"]
        )

    if search:
        query = query.ilike(
            "title",
            f"%{search}%"
        )

    if city:
        query = query.ilike(
            "city",
            city
        )

    if status:
        query = query.eq("status", status)

    if category_id:
        query = query.eq(
            "category_id",
            str(category_id)
        )

    start = (page - 1) * limit
    end = start + limit - 1

    result = (
        query
        .order("event_date")
        .range(start, end)
        .execute()
    )

    return {
        "total": result.count or 0,
        "page": page,
        "limit": limit,
        "events": result.data
    }


# =====================================================
# GET EVENT DETAILS
# =====================================================

@router.get("/{event_id}")
def get_event(
    event_id: UUID,
    current_user: dict = Depends(get_current_user)
):

    query = (
        get_supabase_admin()
        .table("events")
        .select("*, categories(id, name)")
        .eq("id", str(event_id))
    )

    if current_user["role"] != "admin":
        query = query.in_(
            "status",
            ["upcoming", "ongoing"]
        )

    result = query.limit(1).execute()

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return result.data[0]


# =====================================================
# CREATE EVENT
# =====================================================

@router.post("/", status_code=201)
def create_event(
    payload: EventCreate,
    admin: dict = Depends(require_admin)
):

    validate_category(payload.category_id)

    result = (
        get_supabase_admin()
        .table("events")
        .insert(
            payload.model_dump(mode="json")
        )
        .execute()
    )

    return {
        "message": "Event created successfully",
        "event": result.data[0]
    }


# =====================================================
# UPDATE EVENT
# =====================================================

@router.put("/{event_id}")
def update_event(
    event_id: UUID,
    payload: EventUpdate,
    admin: dict = Depends(require_admin)
):

    data = payload.model_dump(
        mode="json",
        exclude_unset=True
    )

    if not data:
        raise HTTPException(
            status_code=400,
            detail="No changes provided"
        )

    required_fields = (
        "title",
        "venue",
        "city",
        "event_date",
        "event_time",
        "ticket_price",
        "total_seats",
        "status"
    )

    for field in required_fields:
        if field in data and data[field] is None:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null"
            )

    if "category_id" in data:
        validate_category(payload.category_id)

    result = (
        get_supabase_admin()
        .table("events")
        .update(data)
        .eq("id", str(event_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return {
        "message": "Event updated successfully",
        "event": result.data[0]
    }


# =====================================================
# CANCEL EVENT
# =====================================================

@router.delete("/{event_id}")
def cancel_event(
    event_id: UUID,
    admin: dict = Depends(require_admin)
):

    result = (
        get_supabase_admin()
        .table("events")
        .update({
            "status": "cancelled"
        })
        .eq("id", str(event_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    return {
        "message": "Event cancelled successfully"
    }