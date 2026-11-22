from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError

from app.core.database import get_supabase_admin
from app.dependencies.auth import get_current_user, require_admin
from app.schemas.category import CategoryCreate, CategoryUpdate


router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)


@router.get("/")
def get_categories(
    current_user: dict = Depends(get_current_user)
):
    query = (
        get_supabase_admin()
        .table("categories")
        .select("*")
    )

    if current_user["role"] != "admin":
        query = query.eq("is_active", True)

    result = query.order("name").execute()

    return {
        "total": len(result.data),
        "categories": result.data
    }


@router.post("/", status_code=201)
def create_category(
    payload: CategoryCreate,
    admin: dict = Depends(require_admin)
):
    try:
        result = (
            get_supabase_admin()
            .table("categories")
            .insert(payload.model_dump())
            .execute()
        )

        return {
            "message": "Category created successfully",
            "category": result.data[0]
        }

    except APIError as exc:
        if exc.code == "23505":
            raise HTTPException(
                status_code=409,
                detail="Category already exists"
            )
        raise HTTPException(
            status_code=500,
            detail="Unable to create category"
        )


@router.put("/{category_id}")
def update_category(
    category_id: UUID,
    payload: CategoryUpdate,
    admin: dict = Depends(require_admin)
):
    data = payload.model_dump(exclude_unset=True)

    if not data:
        raise HTTPException(
            status_code=400,
            detail="No changes provided"
        )

    if any(
        data.get(field) is None
        for field in ("name", "is_active")
        if field in data
    ):
        raise HTTPException(
            status_code=422,
            detail="Name and active status cannot be null"
        )

    try:
        result = (
            get_supabase_admin()
            .table("categories")
            .update(data)
            .eq("id", str(category_id))
            .execute()
        )
    except APIError as exc:
        if exc.code == "23505":
            raise HTTPException(
                status_code=409,
                detail="Category already exists"
            )
        raise HTTPException(
            status_code=500,
            detail="Unable to update category"
        )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return {
        "message": "Category updated successfully",
        "category": result.data[0]
    }


@router.delete("/{category_id}")
def deactivate_category(
    category_id: UUID,
    admin: dict = Depends(require_admin)
):
    result = (
        get_supabase_admin()
        .table("categories")
        .update({"is_active": False})
        .eq("id", str(category_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    return {
        "message": "Category deactivated successfully"
    }