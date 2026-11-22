from supabase import create_client, Client

from app.core.config import settings


def get_supabase_admin() -> Client:
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SECRET_KEY
    )


def get_supabase_auth() -> Client:
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_PUBLISHABLE_KEY
    )