"""
Emotion Aggregator Service.
Buffers frame-level emotion detections over a configurable temporal window (e.g., 8s),
computes confidence-weighted distributions, tracks observed expression persistence/trend,
and produces standardized summary payloads.
"""

import threading
import time
from typing import Any, Dict, List, Optional
from app.config import EMOTION_CLASSES, settings


class EmotionAggregator:
    """
    Thread-safe temporal emotion aggregator for a single monitoring session.
    """

    def __init__(self, window_seconds: Optional[float] = None, session_id: Optional[str] = None):
        self.window_seconds: float = float(
            window_seconds if window_seconds is not None else settings.WINDOW_SECONDS
        )
        self.session_id: Optional[str] = session_id
        self.window_start_time: float = time.time()
        self.current_window_observations: List[Dict[str, Any]] = []

        # State tracking across consecutive windows
        self.last_summary: Optional[Dict[str, Any]] = None
        self.last_dominant_emotion: Optional[str] = None
        self.dominant_emotion_duration: float = 0.0
        self.completed_windows_count: int = 0
        self._lock = threading.Lock()

    def set_window_seconds(self, seconds: float) -> None:
        """Updates window duration."""
        with self._lock:
            self.window_seconds = float(seconds)

    def add_observation(self, detection_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Records a frame observation. If the window duration has elapsed,
        generates and returns the completed summary, then resets the buffer.
        """
        with self._lock:
            self.current_window_observations.append({
                "timestamp": detection_result.get("timestamp", time.time()),
                "face_detected": detection_result.get("face_detected", False),
                "emotion": detection_result.get("emotion"),
                "confidence": float(detection_result.get("confidence", 0.0)),
            })

            elapsed = time.time() - self.window_start_time
            if elapsed >= self.window_seconds:
                summary = self._compute_summary_unlocked()
                self._reset_current_window_unlocked()
                return summary

            return None

    def _reset_current_window_unlocked(self) -> None:
        """Resets the observation buffer without acquiring lock."""
        self.current_window_observations = []
        self.window_start_time = time.time()

    def generate_summary(self) -> Dict[str, Any]:
        """Manually triggers summary computation on current buffer."""
        with self._lock:
            summary = self._compute_summary_unlocked()
            self._reset_current_window_unlocked()
            return summary

    def _compute_summary_unlocked(self) -> Dict[str, Any]:
        """Internal summary calculation logic."""
        timestamp = time.time()
        total_frames = len(self.current_window_observations)

        face_frames = [
            obs for obs in self.current_window_observations
            if obs.get("face_detected") and obs.get("emotion") is not None
        ]
        frames_with_face_count = len(face_frames)
        face_detected_ratio = (
            round(frames_with_face_count / total_frames, 4) if total_frames > 0 else 0.0
        )

        # Case: No face detected in the entire window
        if frames_with_face_count == 0:
            dominant_emotion = None
            dominant_confidence = 0.0
            emotion_distribution = {emo: 0.0 for emo in EMOTION_CLASSES}
            emotion_trend = "unknown"
            self.dominant_emotion_duration = 0.0
            self.last_dominant_emotion = None

            summary = {
                "session_id": self.session_id,
                "timestamp": timestamp,
                "window_seconds": round(self.window_seconds, 1),
                "dominant_emotion": dominant_emotion,
                "dominant_confidence": dominant_confidence,
                "emotion_distribution": emotion_distribution,
                "face_detected_ratio": face_detected_ratio,
                "emotion_trend": emotion_trend,
                "dominant_emotion_duration_seconds": self.dominant_emotion_duration,
                "total_frames_in_window": total_frames,
                "frames_with_face": frames_with_face_count,
            }
            self.last_summary = summary
            self.completed_windows_count += 1
            return summary

        # 1. Confidence-weighted distribution
        weights: Dict[str, float] = {emo: 0.0 for emo in EMOTION_CLASSES}
        confidences_by_emotion: Dict[str, List[float]] = {emo: [] for emo in EMOTION_CLASSES}

        for obs in face_frames:
            emo = str(obs["emotion"]).lower()
            conf = float(obs["confidence"])
            weights[emo] = weights.get(emo, 0.0) + conf
            confidences_by_emotion.setdefault(emo, []).append(conf)

        total_weight = sum(weights.values())
        emotion_distribution = {
            emo: round(w / total_weight, 4) if total_weight > 0 else 0.0
            for emo, w in weights.items()
        }

        # 2. Dominant emotion
        dominant_emotion = max(weights.items(), key=lambda item: item[1])[0]

        # 3. Dominant confidence (average raw model confidence for the dominant emotion)
        dom_confs = confidences_by_emotion.get(dominant_emotion, [])
        dominant_confidence = (
            round(sum(dom_confs) / len(dom_confs), 4) if dom_confs else 0.0
        )

        # 4. Observed facial expression trend & persistence tracking
        if self.last_dominant_emotion is None:
            emotion_trend = "unknown"
            self.dominant_emotion_duration = round(self.window_seconds, 1)
        elif dominant_emotion == self.last_dominant_emotion:
            emotion_trend = "persistent"
            self.dominant_emotion_duration = round(
                self.dominant_emotion_duration + self.window_seconds, 1
            )
        else:
            emotion_trend = "changing"
            self.dominant_emotion_duration = round(self.window_seconds, 1)

        self.last_dominant_emotion = dominant_emotion

        summary = {
            "session_id": self.session_id,
            "timestamp": timestamp,
            "window_seconds": round(self.window_seconds, 1),
            "dominant_emotion": dominant_emotion,
            "dominant_confidence": dominant_confidence,
            "emotion_distribution": emotion_distribution,
            "face_detected_ratio": face_detected_ratio,
            "emotion_trend": emotion_trend,
            "dominant_emotion_duration_seconds": self.dominant_emotion_duration,
            "total_frames_in_window": total_frames,
            "frames_with_face": frames_with_face_count,
        }

        self.last_summary = summary
        self.completed_windows_count += 1
        return summary

    def get_latest_summary(self) -> Optional[Dict[str, Any]]:
        """Returns the most recently generated summary."""
        with self._lock:
            return self.last_summary
