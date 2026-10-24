from datetime import datetime
from typing import Any, List, Literal, Optional

from pydantic import BaseModel, Field

ProvenanceType = Literal["detected", "inferred", "missing", "needs_review"]


class ProvenanceItem(BaseModel):
    value: Any
    provenance: ProvenanceType
    source: Optional[str] = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class GitHubAnalyzeRequest(BaseModel):
    repository_url: str = Field(..., description="Full GitHub URL, e.g. https://github.com/owner/repo")


class GitHubAnalysisResult(BaseModel):
    repository_name: ProvenanceItem
    repository_owner: ProvenanceItem
    repository_url: ProvenanceItem
    description: ProvenanceItem
    readme_summary: ProvenanceItem
    primary_language: ProvenanceItem
    languages: ProvenanceItem
    project_category: ProvenanceItem
    frontend_framework: ProvenanceItem
    backend_framework: ProvenanceItem
    database_technology: ProvenanceItem
    technologies: ProvenanceItem
    dependency_manifests: ProvenanceItem
    entry_points: ProvenanceItem
    notebook_urls: ProvenanceItem
    docker_support: ProvenanceItem
    ci_workflows: ProvenanceItem
    default_branch: ProvenanceItem
    stars_count: Optional[int] = 0
    forks_count: Optional[int] = 0
    open_issues_count: Optional[int] = 0
    license: Optional[str] = None
    homepage: Optional[str] = None
    is_fork: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    directory_tree_sample: List[str] = Field(default_factory=list)
    key_features: Optional[ProvenanceItem] = None
    limitations: List[str] = Field(default_factory=list)
    evidence_references: List[str] = Field(default_factory=list)


class GitHubAnalyzeResponse(BaseModel):
    success: bool
    data: Optional[GitHubAnalysisResult] = None
    error: Optional[str] = None
    is_duplicate: bool = False
    existing_project_id: Optional[str] = None
