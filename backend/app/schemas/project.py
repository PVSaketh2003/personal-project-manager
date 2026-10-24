from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str = Field(default="")
    repository_url: Optional[str] = None
    repository_owner: Optional[str] = None
    repository_name: Optional[str] = None
    deployment_url: Optional[str] = None
    status: str = Field(default="In Development")
    project_type: str = Field(default="Web Application")
    primary_language: Optional[str] = None
    languages: Dict[str, Any] = Field(default_factory=dict)
    frontend_framework: Optional[str] = None
    backend_framework: Optional[str] = None
    database_technology: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    readme_summary: Optional[str] = None
    notebook_urls: List[str] = Field(default_factory=list)
    dependency_manifests: Dict[str, Any] = Field(default_factory=dict)
    entry_points: Dict[str, Any] = Field(default_factory=dict)
    project_notes: Optional[str] = None
    repository_analysis_metadata: Optional[Dict[str, Any]] = None
    analysis_timestamp: Optional[datetime] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    repository_url: Optional[str] = None
    repository_owner: Optional[str] = None
    repository_name: Optional[str] = None
    deployment_url: Optional[str] = None
    status: Optional[str] = None
    project_type: Optional[str] = None
    primary_language: Optional[str] = None
    languages: Optional[Dict[str, Any]] = None
    frontend_framework: Optional[str] = None
    backend_framework: Optional[str] = None
    database_technology: Optional[str] = None
    technologies: Optional[List[str]] = None
    readme_summary: Optional[str] = None
    notebook_urls: Optional[List[str]] = None
    dependency_manifests: Optional[Dict[str, Any]] = None
    entry_points: Optional[Dict[str, Any]] = None
    project_notes: Optional[str] = None
    repository_analysis_metadata: Optional[Dict[str, Any]] = None
    analysis_timestamp: Optional[datetime] = None
    local_status: Optional[str] = None
    local_path: Optional[str] = None
    local_port_frontend: Optional[int] = None
    local_port_backend: Optional[int] = None


class ProjectResponse(ProjectBase):
    id: str
    local_path: Optional[str] = None
    local_status: str = "idle"
    local_port_frontend: Optional[int] = None
    local_port_backend: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(BaseModel):
    items: List[ProjectResponse]
    total: int
    page: int
    page_size: int
    pages: int


class DashboardStats(BaseModel):
    total_projects: int
    deployed_projects: int
    completed_projects: int
    in_development_projects: int
    incomplete_projects: int
    archived_projects: int
    planning_projects: int
    top_technologies: List[Dict[str, Any]]
    recent_projects: List[ProjectResponse]
