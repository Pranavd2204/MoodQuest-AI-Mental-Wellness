"""
System and Health Check Endpoints.
"""

from fastapi import APIRouter
from app.config import settings
from app.schemas.common import HealthResponse, RootResponse, StatusResponse
from app.services import emotion_detector, session_manager, webcam_service

router = APIRouter(tags=["System"])


@router.get(
    "/",
    response_model=RootResponse,
    summary="Root Service Information",
    description="Returns high-level metadata and operational status of the service.",
)
async def get_root() -> RootResponse:
    return RootResponse(
        service=settings.SERVICE_NAME,
        version=settings.SERVICE_VERSION,
        status="running",
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Lightweight Health Check",
    description="Fast, non-blocking health check endpoint verifying model and camera status without triggering inference.",
)
async def get_health() -> HealthResponse:
    model_loaded = emotion_detector.model is not None
    camera_available = webcam_service.is_camera_available()
    device = f"cuda:{emotion_detector.device}" if emotion_detector.device != "cpu" else "cpu"

    return HealthResponse(
        status="healthy" if model_loaded else "degraded",
        model_loaded=model_loaded,
        camera_available=camera_available,
        device=device,
    )


@router.get(
    "/status",
    response_model=StatusResponse,
    summary="Detailed Service Status",
    description="Provides active session counts, hardware device information, and physical camera usage state.",
)
async def get_status() -> StatusResponse:
    model_loaded = emotion_detector.model is not None
    device = f"cuda:{emotion_detector.device}" if emotion_detector.device != "cpu" else "cpu"
    active_sessions = session_manager.get_active_sessions_count()
    camera_in_use = webcam_service.is_camera_in_use()

    return StatusResponse(
        service="running",
        model_loaded=model_loaded,
        device=device,
        active_sessions=active_sessions,
        camera_in_use=camera_in_use,
    )
