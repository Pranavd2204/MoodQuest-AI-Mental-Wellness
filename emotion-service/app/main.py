"""
Main FastAPI Application Entry Point.
Provides a REST service for real-time facial expression detection and continuous aggregation.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    config_router,
    model_router,
    sessions_router,
    summaries_router,
    system_router,
    integration_router,
)
from app.config import settings
from app.services import webcam_service, session_manager
from app.utils.logging import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup checks and graceful cleanup."""
    logger.info("=" * 60)
    logger.info("FACIAL EMOTION DETECTION REST SERVICE - INITIALIZING")
    logger.info("=" * 60)
    logger.info(f" Service Name    : {settings.SERVICE_NAME}")
    logger.info(f" Version         : {settings.SERVICE_VERSION}")
    logger.info(f" Model Path      : {settings.MODEL_PATH}")
    logger.info(f" Default Device  : {settings.DEVICE}")
    logger.info(f" Window Seconds  : {settings.WINDOW_SECONDS}s")
    logger.info(f" Allowed Origins : {settings.ALLOWED_ORIGINS}")
    logger.info("=" * 60)

    yield

    logger.info("Shutting down Facial Emotion Detection Service...")
    # Clean up any running webcam workers
    for session_dict in session_manager.list_sessions():
        s = session_manager.get_session(session_dict["session_id"])
        if s and s.monitoring:
            webcam_service.stop_monitoring(s)
    logger.info("All resources cleanly released. Service shutdown complete.")


app = FastAPI(
    title="Facial Emotion Detection API",
    description=(
        "Production REST service for real-time facial expression perception and "
        "8-second continuous emotion aggregation powered by YOLO11n and NVIDIA CUDA."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(system_router)
app.include_router(model_router)
app.include_router(sessions_router)
app.include_router(summaries_router)
app.include_router(config_router)
app.include_router(integration_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
    )
