from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.github import GitHubAnalyzeRequest, GitHubAnalyzeResponse
from app.services.github_analyzer import GitHubAnalyzerService
from app.services.project_service import ProjectService

router = APIRouter(prefix="/github", tags=["github"])


@router.post("/analyze", response_model=GitHubAnalyzeResponse)
async def analyze_github_repository(
    request: GitHubAnalyzeRequest,
    db: AsyncSession = Depends(get_db),
):
    url = request.repository_url.strip()

    # Check duplicate
    existing = await ProjectService.get_project_by_repo_url(db, url)
    is_duplicate = existing is not None
    existing_id = existing.id if existing else None

    success, result, error = await GitHubAnalyzerService.analyze_repository(url)
    if not success or not result:
        return GitHubAnalyzeResponse(
            success=False,
            error=error or "Could not analyze repository.",
            is_duplicate=is_duplicate,
            existing_project_id=existing_id,
        )

    return GitHubAnalyzeResponse(
        success=True,
        data=result,
        is_duplicate=is_duplicate,
        existing_project_id=existing_id,
    )
