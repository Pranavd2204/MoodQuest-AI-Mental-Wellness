"""Configuration Pydantic Schemas."""
from typing import Optional
from pydantic import BaseModel, Field


class ConfigurationResponse(BaseModel):
    confidence_threshold: float = Field(..., example=0.50)
    window_seconds: float = Field(..., example=8.0)
    camera_index: int = Field(..., example=0)
    device: str = Field(..., example="cuda:0")


class ConfigurationUpdateRequest(BaseModel):
    confidence_threshold: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for YOLO detections (0.0 - 1.0)",
        example=0.60,
    )
    window_seconds: Optional[float] = Field(
        default=None,
        ge=5.0,
        le=60.0,
        description="Aggregation time window in seconds (5.0 - 60.0)",
        example=10.0,
    )
    camera_index: Optional[int] = Field(
        default=None,
        ge=0,
        description="Camera device index (must be >= 0)",
        example=0,
    )
