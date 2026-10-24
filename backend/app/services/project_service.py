import logging
from typing import Dict, List, Optional, Tuple

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.schemas.project import DashboardStats, ProjectCreate, ProjectResponse, ProjectUpdate
from app.services.chromadb_service import ChromaService

logger = logging.getLogger(__name__)


class ProjectService:
    @staticmethod
    async def create_project(db: AsyncSession, project_in: ProjectCreate) -> Project:
        data = project_in.model_dump()
        project = Project(**data)
        db.add(project)
        await db.commit()
        await db.refresh(project)

        # Index in ChromaDB
        ChromaService.index_project(
            project_id=project.id,
            name=project.name,
            description=project.description,
            readme_summary=project.readme_summary,
            technologies=project.technologies,
        )

        return project

    @staticmethod
    async def get_project(db: AsyncSession, project_id: str) -> Optional[Project]:
        result = await db.execute(select(Project).where(Project.id == project_id))
        return result.scalars().first()

    @staticmethod
    async def get_project_by_repo_url(db: AsyncSession, repo_url: str) -> Optional[Project]:
        if not repo_url:
            return None
        clean_url = repo_url.strip().rstrip("/")
        result = await db.execute(
            select(Project).where(
                or_(
                    Project.repository_url == clean_url,
                    Project.repository_url == clean_url + "/",
                    Project.repository_url == clean_url + ".git",
                )
            )
        )
        return result.scalars().first()

    @staticmethod
    async def list_projects(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        status: Optional[str] = None,
        technology: Optional[str] = None,
        category: Optional[str] = None,
        sort_by: str = "updated_at",
        sort_order: str = "desc",
    ) -> Tuple[List[Project], int]:
        query = select(Project)

        if search:
            # Check semantic search first
            chroma_ids = ChromaService.search(search, n_results=10)
            if chroma_ids:
                query = query.where(
                    or_(
                        Project.id.in_(chroma_ids),
                        Project.name.ilike(f"%{search}%"),
                        Project.description.ilike(f"%{search}%"),
                        Project.primary_language.ilike(f"%{search}%"),
                    )
                )
            else:
                query = query.where(
                    or_(
                        Project.name.ilike(f"%{search}%"),
                        Project.description.ilike(f"%{search}%"),
                        Project.primary_language.ilike(f"%{search}%"),
                    )
                )

        if status and status != "All":
            query = query.where(Project.status == status)

        if category and category != "All":
            query = query.where(Project.project_type == category)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_res = await db.execute(count_query)
        total = total_res.scalar() or 0

        # Sort
        sort_col = getattr(Project, sort_by, Project.updated_at)
        if sort_order == "desc":
            query = query.order_by(sort_col.desc())
        else:
            query = query.order_by(sort_col.asc())

        # Pagination
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await db.execute(query)
        projects = list(result.scalars().all())

        # Filter technology in memory if JSON column query is dialect-specific
        if technology and technology != "All":
            projects = [p for p in projects if technology in (p.technologies or [])]

        return projects, total

    @staticmethod
    async def update_project(
        db: AsyncSession, project_id: str, project_update: ProjectUpdate
    ) -> Optional[Project]:
        project = await ProjectService.get_project(db, project_id)
        if not project:
            return None

        update_dict = project_update.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(project, key, value)

        await db.commit()
        await db.refresh(project)

        # Update ChromaDB
        ChromaService.index_project(
            project_id=project.id,
            name=project.name,
            description=project.description,
            readme_summary=project.readme_summary,
            technologies=project.technologies,
        )

        return project

    @staticmethod
    async def delete_project(db: AsyncSession, project_id: str) -> bool:
        project = await ProjectService.get_project(db, project_id)
        if not project:
            return False

        await db.delete(project)
        await db.commit()

        # Remove from ChromaDB
        ChromaService.delete_project(project_id)
        return True

    @staticmethod
    async def get_dashboard_stats(db: AsyncSession) -> DashboardStats:
        all_projects_res = await db.execute(select(Project).order_by(Project.created_at.desc()))
        projects = list(all_projects_res.scalars().all())

        total = len(projects)
        deployed = sum(1 for p in projects if p.deployment_url)
        completed = sum(1 for p in projects if p.status == "Completed")
        in_dev = sum(1 for p in projects if p.status == "In Development")
        incomplete = sum(1 for p in projects if p.status == "Incomplete")
        archived = sum(1 for p in projects if p.status == "Archived")
        planning = sum(1 for p in projects if p.status == "Planning")

        tech_counts: Dict[str, int] = {}
        for p in projects:
            for t in (p.technologies or []):
                tech_counts[t] = tech_counts.get(t, 0) + 1

        top_tech = [
            {"name": name, "count": count}
            for name, count in sorted(tech_counts.items(), key=lambda x: x[1], reverse=True)[:8]
        ]

        recent = [ProjectResponse.model_validate(p) for p in projects[:5]]

        return DashboardStats(
            total_projects=total,
            deployed_projects=deployed,
            completed_projects=completed,
            in_development_projects=in_dev,
            incomplete_projects=incomplete,
            archived_projects=archived,
            planning_projects=planning,
            top_technologies=top_tech,
            recent_projects=recent,
        )
