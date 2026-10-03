"""Services package initialization."""
from app.services.emotion_aggregator import EmotionAggregator
from app.services.emotion_detector import EmotionDetectorService
from app.services.session_manager import SessionManager, SessionState, session_manager
from app.services.webcam_service import WebcamService

# Global service singletons
emotion_detector: EmotionDetectorService = EmotionDetectorService()
webcam_service: WebcamService = WebcamService(detector=emotion_detector)

__all__ = [
    "EmotionDetectorService",
    "EmotionAggregator",
    "SessionManager",
    "SessionState",
    "session_manager",
    "WebcamService",
    "emotion_detector",
    "webcam_service",
]
