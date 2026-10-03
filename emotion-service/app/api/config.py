"""
Configuration Management Endpoints.
"""

from fastapi import APIRouter, HTTPException, status
from app.config import settings
from app.schemas.configuration import ConfigurationResponse, ConfigurationUpdateRequest
from app.services import emotion_detector, session_manager, webcam_service

router = APIRouter(prefix="/config", tags=["Configuration"])


@router.get(
    "",
    response_model=ConfigurationResponse,
    summary="Get Runtime Configuration",
    description="Returns active inference hyperparameters, time window settings, and hardware options.",
)
async def get_config() -> ConfigurationResponse:
    device = f"cuda:{emotion_detector.device}" if emotion_detector.device != "cpu" else "cpu"
    return ConfigurationResponse(
        confidence_threshold=emotion_detector.conf_threshold,
        window_seconds=settings.WINDOW_SECONDS,
        camera_index=settings.CAMERA_INDEX,
        device=device,
    )


@router.put(
    "",
    response_model=ConfigurationResponse,
    summary="Update Runtime Configuration",
    description="Updates safe runtime values (confidence threshold, window seconds, camera index).",
)
async def update_config(request: ConfigurationUpdateRequest) -> ConfigurationResponse:
    # If camera index is modified while a session is actively monitoring, reject with 409
    if request.camera_index is not None and request.camera_index != settings.CAMERA_INDEX:
        if webcam_service.is_camera_in_use():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot change camera index while webcam monitoring is active.",
            )
        settings.CAMERA_INDEX = request.camera_index

    if request.confidence_threshold is not None:
        settings.CONFIDENCE_THRESHOLD = request.confidence_threshold
        emotion_detector.set_confidence_threshold(request.confidence_threshold)

    if request.window_seconds is not None:
        settings.WINDOW_SECONDS = request.window_seconds
        # Also update active sessions' aggregators if needed
        for s_dict in session_manager.list_sessions():
            s = session_manager.get_session(s_dict["session_id"])
            if s and s.aggregator:
                s.aggregator.set_window_seconds(request.window_seconds)

    device = f"cuda:{emotion_detector.device}" if emotion_detector.device != "cpu" else "cpu"
    return ConfigurationResponse(
        confidence_threshold=emotion_detector.conf_threshold,
        window_seconds=settings.WINDOW_SECONDS,
        camera_index=settings.CAMERA_INDEX,
        device=device,
    )
