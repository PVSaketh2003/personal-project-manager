import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.agent_task import AgentTask
from app.models.project import Project
from app.schemas.agent import (
    AgentInstructionRequest,
    AgentInstructionResponse,
    AgentTaskListResponse,
    AgentTaskResponse,
)
from app.schemas.project import ProjectUpdate
from app.services.agent_graph import agent_workflow
from app.services.project_service import ProjectService
from app.services.runner_service import RunnerService

router = APIRouter(prefix="/agent", tags=["agent"])


@router.get("/tasks", response_model=AgentTaskListResponse)
async def list_agent_tasks(
    limit: int = Query(20, ge=1, le=100),
    project_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    query = select(AgentTask).order_by(AgentTask.created_at.desc())
    if project_id:
        query = query.where(AgentTask.project_id == project_id)
    query = query.limit(limit)
    res = await db.execute(query)
    tasks = list(res.scalars().all())
    return AgentTaskListResponse(
        items=[AgentTaskResponse.model_validate(t) for t in tasks],
        total=len(tasks),
    )


@router.post("/tasks", response_model=AgentInstructionResponse)
async def execute_agent_instruction(
    request: AgentInstructionRequest,
    db: AsyncSession = Depends(get_db),
):
    task_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    # 1. Fetch current projects snapshot for context
    proj_res = await db.execute(select(Project))
    all_projects = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "status": p.status,
            "project_type": p.project_type,
            "technologies": p.technologies,
            "primary_language": p.primary_language,
            "frontend_framework": p.frontend_framework,
            "backend_framework": p.backend_framework,
            "database_technology": p.database_technology,
            "repository_url": p.repository_url,
            "deployment_url": p.deployment_url,
            "readme_summary": p.readme_summary,
            "entry_points": p.entry_points,
            "dependency_manifests": p.dependency_manifests,
            "notebook_urls": p.notebook_urls,
        }
        for p in proj_res.scalars().all()
    ]

    target_project = None
    if request.project_id:
        for p in all_projects:
            if p["id"] == request.project_id:
                target_project = p
                break

    # 2. Run LangGraph Workflow
    initial_state = {
        "task_id": task_id,
        "instruction": request.instruction,
        "project_id": request.project_id,
        "is_confirmed": request.is_confirmed,
        "intent": "",
        "target_project": target_project,
        "all_projects": all_projects,
        "action_result": None,
        "proposed_changes": None,
        "response_message": "",
        "requires_approval": False,
        "status": "pending",
        "error": None,
    }

    final_state = await agent_workflow.ainvoke(initial_state)

    # 3. Handle actual DB updates or local runner triggers if approved
    action_res = final_state.get("action_result") or {}
    if final_state.get("intent") == "update_metadata" and action_res.get("applied") and action_res.get("target_project_id"):
        t_id = action_res["target_project_id"]
        updates = action_res.get("updates", {})
        await ProjectService.update_project(db, t_id, ProjectUpdate(**updates))

    elif final_state.get("intent") == "run_local" and action_res.get("target_project_id"):
        t_id = action_res["target_project_id"]
        p_name = action_res.get("project_name", "project")
        r_url = action_res.get("repo_url")
        if r_url:
            await RunnerService.launch_project(t_id, p_name, r_url)
            await ProjectService.update_project(db, t_id, ProjectUpdate(local_status="starting"))

    elif final_state.get("intent") == "stop_local" and action_res.get("target_project_id"):
        t_id = action_res["target_project_id"]
        RunnerService.stop_project(t_id)
        await ProjectService.update_project(db, t_id, ProjectUpdate(local_status="stopped"))

    # 4. Save Task Audit Record in PostgreSQL
    task_record = AgentTask(
        id=task_id,
        project_id=request.project_id or (target_project["id"] if target_project else None),
        instruction=request.instruction,
        task_type=final_state.get("intent", "general"),
        status="completed" if not final_state.get("error") else "failed",
        result={
            "response": final_state.get("response_message"),
            "action_result": final_state.get("action_result"),
            "proposed_changes": final_state.get("proposed_changes"),
        },
        error_details=final_state.get("error"),
        execution_log=f"Executed LangGraph pipeline for intent '{final_state.get('intent')}'",
        created_at=now,
        started_at=now,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(task_record)
    await db.commit()

    return AgentInstructionResponse(
        task_id=task_id,
        intent=final_state.get("intent", "general"),
        response_message=final_state.get("response_message", ""),
        requires_approval=final_state.get("requires_approval", False),
        proposed_changes=final_state.get("proposed_changes"),
        action_result=final_state.get("action_result"),
        status=final_state.get("status", "completed"),
        error=final_state.get("error"),
    )
