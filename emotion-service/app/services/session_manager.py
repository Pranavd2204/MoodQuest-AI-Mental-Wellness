"""
Session Manager Service.
Maintains in-memory session lifecycles, states, observations, and summaries.
"""

import threading
import time
import uuid
from typing import Any, Dict, List, Optional
from app.services.emotion_aggregator import EmotionAggregator
from app.utils.logging import logger


class SessionState:
    """Represents the runtime state and history of an emotion monitoring session."""

    def __init__(self, session_id: str, window_seconds: float):
        self.session_id: str = session_id
        self.created_at: float = time.time()
        self.started_at: Optional[float] = None
        self.stopped_at: Optional[float] = None
        self.status: str = "created"  # "created", "running", "paused", "stopped"
        self.monitoring: bool = False

        self.aggregator: EmotionAggregator = EmotionAggregator(
            window_seconds=window_seconds, session_id=session_id
        )
        self.latest_observation: Optional[Dict[str, Any]] = None
        self.summaries: List[Dict[str, Any]] = []
        self._lock = threading.Lock()

    def set_running(self) -> None:
        with self._lock:
            self.status = "running"
            self.monitoring = True
            if self.started_at is None:
                self.started_at = time.time()

    def set_paused(self) -> None:
        with self._lock:
            self.status = "paused"
            self.monitoring = False

    def set_stopped(self) -> None:
        with self._lock:
            self.status = "stopped"
            self.monitoring = False
            self.stopped_at = time.time()

    def update_observation(self, observation: Dict[str, Any]) -> None:
        with self._lock:
            self.latest_observation = observation

    def add_summary(self, summary: Dict[str, Any]) -> None:
        with self._lock:
            self.summaries.append(summary)

    def get_latest_observation(self) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self.latest_observation

    def get_latest_summary(self) -> Optional[Dict[str, Any]]:
        with self._lock:
            if self.summaries:
                return self.summaries[-1]
            return self.aggregator.get_latest_summary()

    def get_summaries(self, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        with self._lock:
            return self.summaries[offset : offset + limit]

    def get_total_summaries_count(self) -> int:
        with self._lock:
            return len(self.summaries)

    def to_detail_dict(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "session_id": self.session_id,
                "created_at": self.created_at,
                "started_at": self.started_at,
                "stopped_at": self.stopped_at,
                "status": self.status,
                "monitoring": self.monitoring,
                "summary_count": len(self.summaries),
                "latest_summary": self.summaries[-1] if self.summaries else None,
            }

    def to_list_item(self) -> Dict[str, Any]:
        with self._lock:
            return {
                "session_id": self.session_id,
                "status": self.status,
                "monitoring": self.monitoring,
                "summary_count": len(self.summaries),
            }


class SessionManager:
    """Manages creation, lookup, and deletion of in-memory monitoring sessions."""

    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}
        self._active_camera_session_id: Optional[str] = None
        self._lock = threading.Lock()

    def create_session(
        self, client_session_id: Optional[str] = None, window_seconds: float = 8.0
    ) -> SessionState:
        session_id = client_session_id.strip() if client_session_id else str(uuid.uuid4())
        with self._lock:
            if session_id in self._sessions:
                raise ValueError(f"Session with ID '{session_id}' already exists.")
            session = SessionState(session_id=session_id, window_seconds=window_seconds)
            self._sessions[session_id] = session
            logger.info(f"Session created: {session_id}")
            return session

    def get_session(self, session_id: str) -> Optional[SessionState]:
        with self._lock:
            return self._sessions.get(session_id)

    def list_sessions(self) -> List[Dict[str, Any]]:
        with self._lock:
            return [s.to_list_item() for s in self._sessions.values()]

    def delete_session(self, session_id: str) -> bool:
        with self._lock:
            if session_id in self._sessions:
                if self._active_camera_session_id == session_id:
                    self._active_camera_session_id = None
                del self._sessions[session_id]
                logger.info(f"Session deleted: {session_id}")
                return True
            return False

    def get_active_camera_session_id(self) -> Optional[str]:
        with self._lock:
            return self._active_camera_session_id

    def set_active_camera_session(self, session_id: str) -> None:
        with self._lock:
            self._active_camera_session_id = session_id

    def clear_active_camera_session(self, session_id: Optional[str] = None) -> None:
        with self._lock:
            if session_id is None or self._active_camera_session_id == session_id:
                self._active_camera_session_id = None

    def get_active_sessions_count(self) -> int:
        with self._lock:
            return sum(1 for s in self._sessions.values() if s.monitoring)


# Global session manager instance
session_manager = SessionManager()
