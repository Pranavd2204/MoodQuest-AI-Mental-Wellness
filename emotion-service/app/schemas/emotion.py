"""Emotion and Observation Pydantic Schemas."""
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class EmotionObservation(BaseModel):
    timestamp: float = Field(..., example=1750000000.12)
    face_detected: bool = Field(..., example=True)
    emotion: Optional[str] = Field(default=None, example="happy")
    confidence: float = Field(..., example=0.91)


class EmotionSummary(BaseModel):
    session_id: Optional[str] = Field(default=None, example="user-session-123")
    timestamp: float = Field(..., example=1750000000.12)
    window_seconds: float = Field(..., example=8.0)
    dominant_emotion: Optional[str] = Field(default=None, example="sad")
    dominant_confidence: float = Field(..., example=0.84)
    emotion_distribution: Dict[str, float] = Field(
        ...,
        example={
            "angry": 0.02,
            "contempt": 0.01,
            "disgust": 0.01,
            "fear": 0.07,
            "happy": 0.03,
            "natural": 0.18,
            "sad": 0.72,
            "sleepy": 0.01,
            "surprised": 0.01,
        },
    )
    face_detected_ratio: float = Field(..., example=0.96)
    emotion_trend: str = Field(..., example="persistent")
    dominant_emotion_duration_seconds: float = Field(..., example=16.0)
    total_frames_in_window: Optional[int] = Field(default=None, example=240)
    frames_with_face: Optional[int] = Field(default=None, example=230)


class EmotionSummaryListResponse(BaseModel):
    session_id: str = Field(..., example="user-session-123")
    count: int = Field(..., example=20)
    total: int = Field(..., example=45)
    summaries: List[EmotionSummary]
