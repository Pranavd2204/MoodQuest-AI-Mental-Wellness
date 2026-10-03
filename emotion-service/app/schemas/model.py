"""Model Pydantic Schemas."""
from typing import Dict
from pydantic import BaseModel, Field


class ModelInfoResponse(BaseModel):
    model_name: str = Field(..., example="YOLO11n")
    model_path: str = Field(..., example="runs/detect/emotion_training/facial_expression_yolo/weights/best.pt")
    device: str = Field(..., example="cuda:0")
    confidence_threshold: float = Field(..., example=0.50)
    input_size: int = Field(..., example=640)
    window_seconds: float = Field(..., example=8.0)


class ModelClassesResponse(BaseModel):
    classes: Dict[str, str] = Field(
        ...,
        example={
            "0": "angry",
            "1": "contempt",
            "2": "disgust",
            "3": "fear",
            "4": "happy",
            "5": "natural",
            "6": "sad",
            "7": "sleepy",
            "8": "surprised",
        },
    )
