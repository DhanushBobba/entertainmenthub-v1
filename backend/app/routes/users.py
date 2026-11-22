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

from app.schemas.user import (
    UserStatusUpdate,
    UserProfileUpdate
)


router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


# =====================================================
# GET ALL CUSTOMERS
# =====================================================

@router.get("/")
def get_users(
    search: str | None = None,
    is_active: bool | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    admin: dict = Depends(require_admin)
):

    query = (
        get_supabase_admin()
        .table("profiles")
        .select("*", count="exact")
        .eq("role", "customer")
    )

    if search:
        query = query.ilike(
            "full_name",
            f"%{search}%"
        )

    if is_active is not None:
        query = query.eq("is_active", is_active)

    start = (page - 1) * limit
    end = start + limit - 1

    result = (
        query
        .order("created_at", desc=True)
        .range(start, end)
        .execute()
    )

    return {
        "total": result.count or 0,
        "page": page,
        "limit": limit,
        "users": result.data
    }


# =====================================================
# UPDATE OWN PROFILE
# =====================================================

@router.patch("/me")
def update_my_profile(
    payload: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):

    data = payload.model_dump(exclude_unset=True)

    if not data:
        raise HTTPException(
            status_code=400,
            detail="No changes provided"
        )

    if "full_name" in data and data["full_name"] is None:
        raise HTTPException(
            status_code=422,
            detail="Full name cannot be null"
        )

    result = (
        get_supabase_admin()
        .table("profiles")
        .update(data)
        .eq("id", current_user["id"])
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Profile not found"
        )

    return {
        "message": "Profile updated successfully",
        "user": result.data[0]
    }


# =====================================================
# GET CUSTOMER DETAILS
# =====================================================

@router.get("/{user_id}")
def get_user(
    user_id: UUID,
    admin: dict = Depends(require_admin)
):

    result = (
        get_supabase_admin()
        .table("profiles")
        .select("*")
        .eq("id", str(user_id))
        .eq("role", "customer")
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return result.data[0]


# =====================================================
# ACTIVATE OR DEACTIVATE CUSTOMER
# =====================================================

@router.patch("/{user_id}/status")
def update_user_status(
    user_id: UUID,
    payload: UserStatusUpdate,
    admin: dict = Depends(require_admin)
):

    result = (
        get_supabase_admin()
        .table("profiles")
        .update({
            "is_active": payload.is_active
        })
        .eq("id", str(user_id))
        .eq("role", "customer")
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    return {
        "message": (
            "Customer activated successfully"
            if payload.is_active
            else "Customer deactivated successfully"
        ),
        "user": result.data[0]
    }