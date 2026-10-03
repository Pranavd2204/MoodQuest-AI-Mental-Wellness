"""
Emotion Summary Endpoints.
"""

from fastapi import APIRouter, HTTPException, Query, status
from app.schemas.emotion import EmotionSummary, EmotionSummaryListResponse
from app.services import session_manager

router = APIRouter(prefix="/sessions", tags=["Summaries"])


@router.get(
    "/{session_id}/latest",
    response_model=EmotionSummary,
    summary="Get Latest 8-Second Summary",
    description="Returns the most recent completed temporal emotion summary for the session.",
)
async def get_latest_summary(session_id: str) -> EmotionSummary:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )

    summary = session.get_latest_summary()
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No summaries generated yet for session '{session_id}'.",
        )

    return EmotionSummary(**summary)


@router.get(
    "/{session_id}/summary",
    response_model=EmotionSummary,
    summary="Get Summary (Alias)",
    description="Alias endpoint returning the most recent completed temporal emotion summary.",
)
async def get_summary_alias(session_id: str) -> EmotionSummary:
    return await get_latest_summary(session_id=session_id)


@router.get(
    "/{session_id}/summaries",
    response_model=EmotionSummaryListResponse,
    summary="List Historical Summaries",
    description="Returns paginated list of all completed temporal summaries recorded during the session.",
)
async def list_summaries(
    session_id: str,
    limit: int = Query(default=50, ge=1, le=500, description="Maximum number of summaries to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
) -> EmotionSummaryListResponse:
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )

    summaries = session.get_summaries(limit=limit, offset=offset)
    total = session.get_total_summaries_count()

    return EmotionSummaryListResponse(
        session_id=session_id,
        count=len(summaries),
        total=total,
        summaries=[EmotionSummary(**s) for s in summaries],
    )
