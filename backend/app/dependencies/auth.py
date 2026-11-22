from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.database import get_supabase_auth, get_supabase_admin


security = HTTPBearer(auto_error=False)


def get_profile(user_id: str):
    result = (
        get_supabase_admin()
        .table("profiles")
        .select("*")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail="User profile not found"
        )

    profile = result.data[0]

    if not profile["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="Account is inactive"
        )

    return profile


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )

    try:
        response = get_supabase_auth().auth.get_user(
            credentials.credentials
        )

        if not response.user:
            raise ValueError("Invalid user")

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired access token"
        )

    return get_profile(str(response.user.id))


def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator access required"
        )

    return current_user


def require_customer(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "customer":
        raise HTTPException(
            status_code=403,
            detail="Customer access required"
        )

    return current_user