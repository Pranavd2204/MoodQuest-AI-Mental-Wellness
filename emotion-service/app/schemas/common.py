"""Common Pydantic Schemas."""
from pydantic import BaseModel, Field


class RootResponse(BaseModel):
    service: str = Field(..., example="Facial Emotion Detection API")
    version: str = Field(..., example="1.0.0")
    status: str = Field(..., example="running")


class HealthResponse(BaseModel):
    status: str = Field(..., example="healthy")
    model_loaded: bool = Field(..., example=True)
    camera_available: bool = Field(..., example=True)
    device: str = Field(..., example="cuda:0")


class StatusResponse(BaseModel):
    service: str = Field(..., example="running")
    model_loaded: bool = Field(..., example=True)
    device: str = Field(..., example="cuda:0")
    active_sessions: int = Field(..., example=1)
    camera_in_use: bool = Field(..., example=True)


class ErrorDetail(BaseModel):
    detail: str = Field(..., example="Resource not found")
