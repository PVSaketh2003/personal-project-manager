import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.project import ProjectCreate, ProjectListResponse, ProjectResponse, ProjectUpdate
from app.services.github_analyzer import GitHubAnalyzerService
from app.services.project_service import ProjectService
from app.services.runner_service import RunnerService

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    technology: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    sort_by: str = Query("updated_at"),
    sort_order: str = Query("desc"),
    db: AsyncSession = Depends(get_db),
):
    projects, total = await ProjectService.list_projects(
        db,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        technology=technology,
        category=category,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    pages = math.ceil(total / page_size) if total > 0 else 1
    return ProjectListResponse(
        items=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.get("/search", response_model=ProjectListResponse)
async def search_projects(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    projects, total = await ProjectService.list_projects(
        db,
        page=page,
        page_size=page_size,
        search=q,
    )
    pages = math.ceil(total / page_size) if total > 0 else 1
    return ProjectListResponse(
        items=[ProjectResponse.model_validate(p) for p in projects],
        total=total,
        page=page,
        page_size=page_size,
        pages=pages,
    )


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_in: ProjectCreate,
    db: AsyncSession = Depends(get_db),
):
    # Check duplicate repository URL if provided
    if project_in.repository_url:
        existing = await ProjectService.get_project_by_repo_url(db, project_in.repository_url)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A project with this repository URL already exists ('{existing.name}').",
            )
    project = await ProjectService.create_project(db, project_in)
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
):
    updated = await ProjectService.update_project(db, project_id, project_update)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return ProjectResponse.model_validate(updated)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    success = await ProjectService.delete_project(db, project_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return None


@router.get("/{project_id}/analysis")
async def get_project_analysis(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return {
        "project_id": project.id,
        "name": project.name,
        "repository_url": project.repository_url,
        "analysis": project.repository_analysis_metadata,
        "analysis_timestamp": project.analysis_timestamp,
    }


@router.post("/{project_id}/reanalyze", response_model=ProjectResponse)
async def reanalyze_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if not project.repository_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project has no repository URL")

    success, result, error = await GitHubAnalyzerService.analyze_repository(project.repository_url)
    if not success or not result:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error or "Analysis failed")

    update_payload = ProjectUpdate(
        readme_summary=result.readme_summary.value,
        primary_language=result.primary_language.value,
        languages=result.languages.value,
        frontend_framework=result.frontend_framework.value,
        backend_framework=result.backend_framework.value,
        database_technology=result.database_technology.value,
        technologies=result.technologies.value,
        notebook_urls=result.notebook_urls.value,
        dependency_manifests=result.dependency_manifests.value,
        entry_points=result.entry_points.value,
        repository_analysis_metadata=result.model_dump(),
        analysis_timestamp=result.updated_at,
    )
    updated = await ProjectService.update_project(db, project_id, update_payload)
    return ProjectResponse.model_validate(updated)


# Local Runner endpoints (macOS clone & execution)
@router.post("/{project_id}/run")
async def run_project_locally(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    if not project.repository_url:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project has no repository URL to clone")

    res = await RunnerService.launch_project(project.id, project.name, project.repository_url)
    await ProjectService.update_project(
        db, project_id, ProjectUpdate(local_status="starting", local_path=res.get("target_dir"))
    )
    return res


@router.post("/{project_id}/stop")
async def stop_project_locally(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    res = RunnerService.stop_project(project.id)
    await ProjectService.update_project(db, project_id, ProjectUpdate(local_status="stopped"))
    return res


@router.get("/{project_id}/run/status")
async def get_project_run_status(
    project_id: str,
    db: AsyncSession = Depends(get_db),
):
    project = await ProjectService.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    info = RunnerService.get_status(project.id)
    # Sync with DB if status changed
    if info.get("status") and info.get("status") != project.local_status:
        await ProjectService.update_project(
            db,
            project_id,
            ProjectUpdate(
                local_status=info["status"],
                local_port_frontend=info.get("frontend_port"),
                local_port_backend=info.get("backend_port"),
            ),
        )
    return info
