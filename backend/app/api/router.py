from datetime import datetime, timezone

from fastapi import APIRouter

from app.api.v1 import agent, dashboard, github, projects, settings
from app.schemas.health import HealthCheckResponse

api_router = APIRouter()


@api_router.get("/health", response_model=HealthCheckResponse, tags=["health"])
async def api_health():
    return HealthCheckResponse(
        status="ok",
        timestamp=datetime.now(timezone.utc),
        version="1.0.0",
    )


api_router.include_router(projects.router)
api_router.include_router(dashboard.router)
api_router.include_router(github.router)
api_router.include_router(agent.router)
api_router.include_router(settings.router)
