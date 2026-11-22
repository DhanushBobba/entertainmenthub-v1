from fastapi import APIRouter, Depends

from app.core.database import get_supabase_admin
from app.dependencies.auth import require_admin


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


# =====================================================
# DASHBOARD STATISTICS
# =====================================================

@router.get("/statistics")
def get_dashboard_statistics(
    admin: dict = Depends(require_admin)
):

    result = (
        get_supabase_admin()
        .rpc("get_dashboard_statistics")
        .execute()
    )

    return {
        "success": True,
        "statistics": result.data
    }


# =====================================================
# RECENT BOOKINGS
# =====================================================

@router.get("/recent-bookings")
def get_recent_bookings(
    admin: dict = Depends(require_admin)
):

    result = (
        get_supabase_admin()
        .table("bookings")
        .select(
            """
            *,
            profiles(id, full_name, email),
            movies(id, title, poster_url),
            events(id, title, banner_url)
            """
        )
        .order("created_at", desc=True)
        .limit(10)
        .execute()
    )

    return {
        "total": len(result.data),
        "bookings": result.data
    }


# =====================================================
# UPCOMING EVENTS
# =====================================================

@router.get("/upcoming-events")
def get_upcoming_events(
    admin: dict = Depends(require_admin)
):

    result = (
        get_supabase_admin()
        .table("events")
        .select("*")
        .eq("status", "upcoming")
        .order("event_date")
        .order("event_time")
        .limit(5)
        .execute()
    )

    return {
        "total": len(result.data),
        "events": result.data
    }