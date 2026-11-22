from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

from app.routes.auth import router as auth_router
from app.routes.categories import router as categories_router
from app.routes.movies import router as movies_router
from app.routes.events import router as events_router
from app.routes.bookings import router as bookings_router
from app.routes.dashboard import router as dashboard_router
from app.routes.users import router as users_router


app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="Entertainment Management System",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


routers = [
    auth_router,
    categories_router,
    movies_router,
    events_router,
    bookings_router,
    dashboard_router,
    users_router
]


for router in routers:
    app.include_router(
        router,
        prefix=settings.API_PREFIX
    )


@app.get("/")
def root():
    return {
        "message": "Welcome to EntertainHub API",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME
    }