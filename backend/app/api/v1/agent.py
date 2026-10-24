import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.agent_task import AgentTask
from app.models.conversation import Conversation, Message
from app.models.project import Project
from app.schemas.agent import (
    AgentInstructionRequest,
    AgentInstructionResponse,
    AgentTaskListResponse,
    AgentTaskResponse,
)
from app.schemas.conversation import (
    ConversationCreate,
    ConversationDetailResponse,
    ConversationListResponse,
    ConversationResponse,
    ConversationUpdate,
    MessageResponse,
    SendMessageRequest,
)
from app.schemas.project import ProjectUpdate
from app.services.agent_graph import agent_workflow
from app.services.project_service import ProjectService
from app.services.runner_service import RunnerService

router = APIRouter(prefix="/agent", tags=["agent"])


# =========================================================================
# 1. PERMANENT CONVERSATION ENDPOINTS (PostgreSQL-backed)
# =========================================================================

@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    project_id: Optional[str] = Query(None),
    include_archived: bool = Query(False),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve all conversations persisted in PostgreSQL."""
    query = select(Conversation).options(selectinload(Conversation.messages)).order_by(Conversation.updated_at.desc())
    if not include_archived:
        query = query.where(Conversation.is_archived.is_(False))
    if project_id:
        query = query.where(Conversation.project_id == project_id)
    query = query.limit(limit)

    res = await db.execute(query)
    convs = list(res.scalars().all())

    items = []
    for c in convs:
        last_msg = c.messages[-1].content[:80] if c.messages else None
        items.append(
            ConversationResponse(
                id=c.id,
                title=c.title,
                project_id=c.project_id,
                is_archived=c.is_archived,
                metadata_json=c.metadata_json,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=len(c.messages),
                last_message_preview=last_msg,
            )
        )

    return ConversationListResponse(items=items, total=len(items))


@router.post("/conversations", response_model=ConversationDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    payload: ConversationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new conversation record in PostgreSQL."""
    now = datetime.now(timezone.utc)
    conv = Conversation(
        id=str(uuid.uuid4()),
        title=payload.title or "New Conversation",
        project_id=payload.project_id,
        is_archived=False,
        created_at=now,
        updated_at=now,
    )
    db.add(conv)
    await db.commit()
    await db.refresh(conv)

    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        project_id=conv.project_id,
        is_archived=conv.is_archived,
        metadata_json=conv.metadata_json,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[],
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Retrieve a single conversation and all its historical ordered messages."""
    query = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    res = await db.execute(query)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return ConversationDetailResponse(
        id=conv.id,
        title=conv.title,
        project_id=conv.project_id,
        is_archived=conv.is_archived,
        metadata_json=conv.metadata_json,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        messages=[MessageResponse.model_validate(m) for m in conv.messages],
    )


@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Rename or archive a conversation."""
    query = select(Conversation).options(selectinload(Conversation.messages)).where(Conversation.id == conversation_id)
    res = await db.execute(query)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if payload.title is not None:
        conv.title = payload.title.strip() or "Untitled Conversation"
    if payload.project_id is not None:
        conv.project_id = payload.project_id
    if payload.is_archived is not None:
        conv.is_archived = payload.is_archived

    conv.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(conv)

    last_msg = conv.messages[-1].content[:80] if conv.messages else None
    return ConversationResponse(
        id=conv.id,
        title=conv.title,
        project_id=conv.project_id,
        is_archived=conv.is_archived,
        metadata_json=conv.metadata_json,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=len(conv.messages),
        last_message_preview=last_msg,
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a conversation and all its messages."""
    query = select(Conversation).where(Conversation.id == conversation_id)
    res = await db.execute(query)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.delete(conv)
    await db.commit()
    return None


@router.post("/conversations/{conversation_id}/messages")
async def post_message_in_conversation(
    conversation_id: str,
    payload: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Append a user message, run the LangGraph agent with conversation history,
    persist both the user message and assistant response to PostgreSQL, and return the result.
    """
    query = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
    )
    res = await db.execute(query)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    now = datetime.now(timezone.utc)
    current_order = len(conv.messages)

    # 1. Persist User Message to PostgreSQL
    user_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="user",
        content=payload.content.strip(),
        message_order=current_order,
        created_at=now,
    )
    db.add(user_msg)
    await db.flush()

    # Auto-generate meaningful conversation title if still default
    if conv.title == "New Conversation":
        cleaned = " ".join(payload.content.strip().split()[:6])
        if len(cleaned) > 40:
            cleaned = cleaned[:37] + "..."
        conv.title = cleaned.capitalize()

    # 2. Fetch Projects Snapshot for Context
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

    target_id = payload.project_id or conv.project_id
    target_project = None
    if target_id:
        for p in all_projects:
            if p["id"] == target_id:
                target_project = p
                break

    # 3. Assemble Conversation History for LangGraph
    messages_history = [
        {"role": m.role, "content": m.content, "metadata": m.metadata_json}
        for m in conv.messages
    ]

    task_id = str(uuid.uuid4())
    initial_state = {
        "task_id": task_id,
        "instruction": payload.content,
        "project_id": target_id,
        "is_confirmed": payload.is_confirmed,
        "intent": "",
        "target_project": target_project,
        "all_projects": all_projects,
        "action_result": None,
        "proposed_changes": None,
        "response_message": "",
        "requires_approval": False,
        "status": "pending",
        "error": None,
        "conversation_id": conversation_id,
        "messages_history": messages_history,
    }

    # 4. Invoke LangGraph Workflow
    final_state = await agent_workflow.ainvoke(initial_state)

    # 5. Apply Approved Actions
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

    # 6. Persist Assistant Response to PostgreSQL
    assistant_msg = Message(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        role="assistant",
        content=final_state.get("response_message", ""),
        message_order=current_order + 1,
        metadata_json={
            "task_id": task_id,
            "intent": final_state.get("intent"),
            "action_result": final_state.get("action_result"),
            "proposed_changes": final_state.get("proposed_changes"),
            "requires_approval": final_state.get("requires_approval"),
            "status": final_state.get("status"),
            "error": final_state.get("error"),
        },
        created_at=datetime.now(timezone.utc),
    )
    db.add(assistant_msg)

    # 7. Also record in AgentTask for audit log
    task_record = AgentTask(
        id=task_id,
        project_id=target_id or (target_project["id"] if target_project else None),
        instruction=payload.content,
        task_type=final_state.get("intent", "general"),
        status="completed" if not final_state.get("error") else "failed",
        result={
            "response": final_state.get("response_message"),
            "action_result": final_state.get("action_result"),
            "proposed_changes": final_state.get("proposed_changes"),
        },
        error_details=final_state.get("error"),
        execution_log=f"Executed in conversation '{conversation_id}' for intent '{final_state.get('intent')}'",
        created_at=now,
        started_at=now,
        completed_at=datetime.now(timezone.utc),
    )
    db.add(task_record)

    conv.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "user_message": MessageResponse.model_validate(user_msg),
        "assistant_message": MessageResponse.model_validate(assistant_msg),
        "agent_response": AgentInstructionResponse(
            task_id=task_id,
            intent=final_state.get("intent", "general"),
            response_message=final_state.get("response_message", ""),
            requires_approval=final_state.get("requires_approval", False),
            proposed_changes=final_state.get("proposed_changes"),
            action_result=final_state.get("action_result"),
            status=final_state.get("status", "completed"),
            error=final_state.get("error"),
        ),
    }


# =========================================================================
# 2. LEGACY / STANDALONE TASK ENDPOINTS (Backward Compatibility)
# =========================================================================

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

    # Fetch projects snapshot
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
        "conversation_id": None,
        "messages_history": [],
    }

    final_state = await agent_workflow.ainvoke(initial_state)

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
        execution_log=f"Executed standalone LangGraph pipeline for intent '{final_state.get('intent')}'",
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
