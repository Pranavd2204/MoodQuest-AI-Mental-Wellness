"""Session Pydantic Schemas."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class SessionCreateRequest(BaseModel):
    client_session_id: Optional[str] = Field(
        default=None,
        description="Optional custom identifier for the session. If omitted, a UUID will be generated.",
        example="user-session-123",
    )


class SessionControlResponse(BaseModel):
    session_id: str = Field(..., example="550e8400-e29b-41d4-a716-446655440000")
    status: str = Field(..., example="running")
    monitoring: bool = Field(..., example=True)


class SessionListItem(BaseModel):
    session_id: str = Field(..., example="550e8400-e29b-41d4-a716-446655440000")
    status: str = Field(..., example="running")
    monitoring: bool = Field(..., example=True)
    summary_count: int = Field(..., example=4)


class SessionListResponse(BaseModel):
    sessions: List[SessionListItem]


class SessionDetailResponse(BaseModel):
    session_id: str = Field(..., example="550e8400-e29b-41d4-a716-446655440000")
    created_at: float = Field(..., example=1750000000.12)
    started_at: Optional[float] = Field(default=None, example=1750000005.34)
    stopped_at: Optional[float] = Field(default=None, example=None)
    status: str = Field(..., example="running")
    monitoring: bool = Field(..., example=True)
    summary_count: int = Field(..., example=4)
    latest_summary: Optional[Dict[str, Any]] = None
