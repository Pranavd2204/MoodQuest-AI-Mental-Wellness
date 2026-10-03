"""
Model Information Endpoints.
"""

from fastapi import APIRouter
from app.config import EMOTION_CLASSES_DICT, settings
from app.schemas.model import ModelClassesResponse, ModelInfoResponse
from app.services import emotion_detector

router = APIRouter(prefix="/model", tags=["Model"])


@router.get(
    "/info",
    response_model=ModelInfoResponse,
    summary="Model Architecture and Inference Parameters",
    description="Returns YOLO11n weights path, input size, confidence threshold, and inference device.",
)
async def get_model_info() -> ModelInfoResponse:
    device = f"cuda:{emotion_detector.device}" if emotion_detector.device != "cpu" else "cpu"
    return ModelInfoResponse(
        model_name="YOLO11n",
        model_path=str(emotion_detector.model_path),
        device=device,
        confidence_threshold=emotion_detector.conf_threshold,
        input_size=emotion_detector.imgsz,
        window_seconds=settings.WINDOW_SECONDS,
    )


@router.get(
    "/classes",
    response_model=ModelClassesResponse,
    summary="Registered Emotion Classes",
    description="Returns dictionary mapping class ID to emotion label (0: angry, ..., 8: surprised).",
)
async def get_model_classes() -> ModelClassesResponse:
    return ModelClassesResponse(classes=EMOTION_CLASSES_DICT)
