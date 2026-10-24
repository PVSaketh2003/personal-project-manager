from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.project import DashboardStats
from app.services.project_service import ProjectService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_statistics(
    db: AsyncSession = Depends(get_db),
):
    return await ProjectService.get_dashboard_stats(db)
