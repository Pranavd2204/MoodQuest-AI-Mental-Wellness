"""
Session Management and Real-Time Observation Endpoints.
"""

from fastapi import APIRouter, HTTPException, status
from app.config import settings
from app.schemas.emotion import EmotionObservation
from app.schemas.session import (
    SessionControlResponse,
    SessionCreateRequest,
    SessionDetailResponse,
    SessionListResponse,
)
from app.services import session_manager, webcam_service

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post(
    "",
    response_model=SessionControlResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Monitoring Session",
    description="Initializes a new emotion monitoring session in memory with optional custom ID.",
)
async def create_session(request: SessionCreateRequest = SessionCreateRequest()) -> SessionControlResponse:
    try:
        session = session_manager.create_session(
            client_session_id=request.client_session_id,
            window_seconds=settings.WINDOW_SECONDS,
        )
        return SessionControlResponse(
            session_id=session.session_id,
            status=session.status,
            monitoring=session.monitoring,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )


@router.get(
    "",
    response_model=SessionListResponse,
    summary="List Monitoring Sessions",
    description="Returns list of all active and recent monitoring sessions.",
)
async def list_sessions() -> SessionListResponse:
    sessions = session_manager.list_sessions()
    return SessionListResponse(sessions=sessions)


@router.get(
    "/{session_id}",
    response_model=SessionDetailResponse,
    summary="Get Session Details",
    description="Retrieves full metadata, timestamps, and summary counts for a specific session.",
)
async def get_session(session_id: str) -> SessionDetailResponse:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )
    return SessionDetailResponse(**session.to_detail_dict())


@router.post(
    "/{session_id}/start",
    response_model=SessionControlResponse,
    summary="Start Webcam Monitoring",
    description="Launches non-blocking background webcam capture and YOLO inference for the session.",
)
async def start_session(session_id: str) -> SessionControlResponse:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )

    if session.monitoring:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Session is already running.",
        )

    try:
        webcam_service.start_monitoring(session=session)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e),
        )

    return SessionControlResponse(
        session_id=session.session_id,
        status="running",
        monitoring=True,
    )


@router.post(
    "/{session_id}/stop",
    response_model=SessionControlResponse,
    summary="Stop Webcam Monitoring",
    description="Stops background worker, releases physical camera, and preserves completed session summaries.",
)
async def stop_session(session_id: str) -> SessionControlResponse:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )

    webcam_service.stop_monitoring(session)

    return SessionControlResponse(
        session_id=session.session_id,
        status="stopped",
        monitoring=False,
    )


@router.post(
    "/{session_id}/pause",
    response_model=SessionControlResponse,
    summary="Pause Webcam Monitoring",
    description="Pauses frame processing without destroying the session or releasing camera.",
)
async def pause_session(session_id: str) -> SessionControlResponse:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )

    if session.status != "running":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot pause session in '{session.status}' state.",
        )

    webcam_service.pause_monitoring(session)

    return SessionControlResponse(
        session_id=session.session_id,
        status="paused",
        monitoring=False,
    )


@router.post(
    "/{session_id}/resume",
    response_model=SessionControlResponse,
    summary="Resume Webcam Monitoring",
    description="Resumes previously paused session monitoring.",
)
async def resume_session(session_id: str) -> SessionControlResponse:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )

    if session.status != "paused":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot resume session in '{session.status}' state.",
        )

    webcam_service.resume_monitoring(session)

    return SessionControlResponse(
        session_id=session.session_id,
        status="running",
        monitoring=True,
    )


@router.delete(
    "/{session_id}",
    summary="Delete Monitoring Session",
    description="Stops any active monitoring and removes the session from memory.",
)
async def delete_session(session_id: str) -> dict:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )

    # Safely stop worker if running
    if session.monitoring or session.status == "running":
        webcam_service.stop_monitoring(session)

    session_manager.delete_session(session_id)
    return {"detail": f"Session '{session_id}' deleted successfully."}


@router.get(
    "/{session_id}/current",
    response_model=EmotionObservation,
    summary="Get Current Frame Observation",
    description="Returns the most recent frame-level emotion detection. Non-blocking; does NOT trigger new inference.",
)
async def get_current_observation(session_id: str) -> EmotionObservation:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )

    obs = session.get_latest_observation()
    if not obs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No observations recorded yet for session '{session_id}'.",
        )

    return EmotionObservation(
        timestamp=obs["timestamp"],
        face_detected=obs["face_detected"],
        emotion=obs["emotion"],
        confidence=obs["confidence"],
    )
