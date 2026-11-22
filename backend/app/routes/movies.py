from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.database import get_supabase_admin
from app.dependencies.auth import get_current_user, require_admin
from app.schemas.movie import MovieCreate, MovieUpdate, MovieStatus


router = APIRouter(
    prefix="/movies",
    tags=["Movies"]
)


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


# LIST MOVIES

@router.get("/")
def get_movies(
    search: str | None = None,
    status: MovieStatus | None = None,
    category_id: UUID | None = None,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    current_user: dict = Depends(get_current_user)
):
    query = (
        get_supabase_admin()
        .table("movies")
        .select("*, categories(id, name)", count="exact")
    )

    if current_user["role"] != "admin":
        query = query.in_(
            "status",
            ["upcoming", "now_showing"]
        )

    if search:
        query = query.ilike("title", f"%{search}%")

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
        .order("created_at", desc=True)
        .range(start, end)
        .execute()
    )

    return {
        "total": result.count or 0,
        "page": page,
        "limit": limit,
        "movies": result.data
    }


# GET MOVIE DETAILS

@router.get("/{movie_id}")
def get_movie(
    movie_id: UUID,
    current_user: dict = Depends(get_current_user)
):
    query = (
        get_supabase_admin()
        .table("movies")
        .select("*, categories(id, name)")
        .eq("id", str(movie_id))
    )

    if current_user["role"] != "admin":
        query = query.in_(
            "status",
            ["upcoming", "now_showing"]
        )

    result = query.limit(1).execute()

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Movie not found"
        )

    return result.data[0]


# CREATE MOVIE

@router.post("/", status_code=201)
def create_movie(
    payload: MovieCreate,
    admin: dict = Depends(require_admin)
):
    validate_category(payload.category_id)

    result = (
        get_supabase_admin()
        .table("movies")
        .insert(payload.model_dump(mode="json"))
        .execute()
    )

    return {
        "message": "Movie created successfully",
        "movie": result.data[0]
    }


# UPDATE MOVIE

@router.put("/{movie_id}")
def update_movie(
    movie_id: UUID,
    payload: MovieUpdate,
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

    if any(
        data.get(field) is None
        for field in ("title", "ticket_price", "status")
        if field in data
    ):
        raise HTTPException(
            status_code=422,
            detail="Required movie fields cannot be null"
        )

    if "category_id" in data:
        validate_category(payload.category_id)

    result = (
        get_supabase_admin()
        .table("movies")
        .update(data)
        .eq("id", str(movie_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Movie not found"
        )

    return {
        "message": "Movie updated successfully",
        "movie": result.data[0]
    }


# DEACTIVATE MOVIE

@router.delete("/{movie_id}")
def delete_movie(
    movie_id: UUID,
    admin: dict = Depends(require_admin)
):
    result = (
        get_supabase_admin()
        .table("movies")
        .update({"status": "inactive"})
        .eq("id", str(movie_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Movie not found"
        )

    return {
        "message": "Movie deactivated successfully"
    }