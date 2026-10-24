from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class AgentTaskCreate(BaseModel):
    instruction: str = Field(..., min_length=1)
    project_id: Optional[str] = None
    task_type: Optional[str] = "general"


class AgentTaskResponse(BaseModel):
    id: str
    project_id: Optional[str] = None
    instruction: str
    task_type: str
    status: str
    result: Optional[Dict[str, Any]] = None
    error_details: Optional[str] = None
    execution_log: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AgentTaskListResponse(BaseModel):
    items: List[AgentTaskResponse]
    total: int


class AgentInstructionRequest(BaseModel):
    instruction: str = Field(..., min_length=1)
    project_id: Optional[str] = None
    is_confirmed: bool = False


class AgentInstructionResponse(BaseModel):
    task_id: str
    intent: str
    response_message: str
    requires_approval: bool = False
    proposed_changes: Optional[Dict[str, Any]] = None
    action_result: Optional[Dict[str, Any]] = None
    status: str
    error: Optional[str] = None
