import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import JSON, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)

    repository_url: Mapped[Optional[str]] = mapped_column(String(512), index=True, nullable=True)
    repository_owner: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    repository_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    deployment_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    status: Mapped[str] = mapped_column(
        String(50), default="In Development", index=True, nullable=False
    )
    project_type: Mapped[str] = mapped_column(
        String(100), default="Web Application", index=True, nullable=False
    )

    primary_language: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    languages: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    frontend_framework: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    backend_framework: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    database_technology: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    technologies: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)

    readme_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notebook_urls: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    dependency_manifests: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    entry_points: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    project_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    repository_analysis_metadata: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    analysis_timestamp: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Local execution support on macOS
    local_path: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    local_status: Mapped[str] = mapped_column(String(50), default="idle", nullable=False)
    local_port_frontend: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    local_port_backend: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False
    )
