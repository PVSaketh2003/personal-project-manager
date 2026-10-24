from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class MessageBase(BaseModel):
    role: str = Field(..., description="Role of message sender: 'user', 'assistant', 'system', 'tool'")
    content: str = Field(..., description="Message text content")
    metadata_json: Optional[Dict[str, Any]] = None


class MessageCreate(MessageBase):
    pass


class MessageResponse(MessageBase):
    id: str
    conversation_id: str
    message_order: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationBase(BaseModel):
    title: str = Field(default="New Conversation", max_length=255)
    project_id: Optional[str] = None
    is_archived: bool = False
    metadata_json: Optional[Dict[str, Any]] = None


class ConversationCreate(BaseModel):
    title: Optional[str] = Field(default="New Conversation", max_length=255)
    project_id: Optional[str] = None
    initial_message: Optional[str] = None


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    project_id: Optional[str] = None
    is_archived: Optional[bool] = None


class ConversationResponse(ConversationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    message_count: int = 0
    last_message_preview: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailResponse(ConversationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ConversationListResponse(BaseModel):
    items: List[ConversationResponse]
    total: int


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, description="User instruction / query")
    project_id: Optional[str] = None
    is_confirmed: bool = False
