from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core.database import get_supabase_auth

from app.dependencies.auth import (
    get_current_user,
    get_profile,
    security,
)

from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RefreshRequest,
    LogoutRequest,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# CUSTOMER REGISTRATION

@router.post("/register", status_code=201)
def register(payload: RegisterRequest):

    try:
        response = get_supabase_auth().auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "full_name": payload.full_name
                }
            }
        })

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Registration failed"
        )

    return {
        "message": "Registration submitted. Check email if confirmation is required.",
        "email_confirmation_required": response.session is None
    }


# LOGIN

@router.post("/login")
def login(payload: LoginRequest):

    try:
        response = get_supabase_auth().auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password
        })

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not response.user or not response.session:
        raise HTTPException(
            status_code=401,
            detail="Login failed"
        )

    profile = get_profile(str(response.user.id))

    return {
        "message": "Login successful",
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "token_type": "bearer",
        "expires_in": response.session.expires_in,
        "user": profile
    }


# CURRENT USER PROFILE

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):

    return current_user


# REFRESH TOKEN

@router.post("/refresh")
def refresh(payload: RefreshRequest):

    try:
        response = get_supabase_auth().auth.refresh_session(
            payload.refresh_token
        )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired refresh token"
        )

    if not response.session or not response.user:
        raise HTTPException(
            status_code=401,
            detail="Session refresh failed"
        )

    profile = get_profile(str(response.user.id))

    return {
        "access_token": response.session.access_token,
        "refresh_token": response.session.refresh_token,
        "token_type": "bearer",
        "expires_in": response.session.expires_in,
        "user": profile
    }


# LOGOUT

@router.post("/logout")
def logout(
    payload: LogoutRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: dict = Depends(get_current_user)
):

    try:
        client = get_supabase_auth()

        response = client.auth.set_session(
            credentials.credentials,
            payload.refresh_token
        )

        if not response.user or str(response.user.id) != current_user["id"]:
            raise ValueError("Session mismatch")

        client.auth.sign_out({"scope": "local"})

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Logout failed"
        )

    return {
        "message": "Logout successful"
    }