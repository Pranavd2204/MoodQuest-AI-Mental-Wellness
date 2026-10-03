"""
Emotion Aggregator Module.
Collects raw frame-level facial expression detections over a configurable time window
(e.g., 8 seconds), computes confidence-weighted statistical distributions, tracks
dominant emotion persistence/trend, and formats structured JSON summaries.
"""

import time
from typing import Any, Dict, List, Optional
from src.config import DEFAULT_WINDOW_SECONDS, EMOTION_CLASSES


class EmotionAggregator:
    """
    Buffers and aggregates facial expression observations across a temporal window.
    Designed to provide stable, low-noise emotion summaries to downstream APIs,
    event dispatchers, or therapy agent dialogue engines without flooding them per-frame.
    """

    def __init__(self, window_seconds: float = DEFAULT_WINDOW_SECONDS):
        """
        Args:
            window_seconds: Duration of the aggregation window in seconds (default: 8.0s).
        """
        self.window_seconds: float = float(window_seconds)
        self.window_start_time: float = time.time()
        self.current_window_observations: List[Dict[str, Any]] = []

        # State tracking across consecutive windows
        self.last_summary: Optional[Dict[str, Any]] = None
        self.last_dominant_emotion: Optional[str] = None
        self.dominant_emotion_duration: float = 0.0
        self.completed_windows_count: int = 0

    def add_observation(self, detection_result: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Appends a frame observation to the active window buffer.
        If the window duration has elapsed, generates, stores, and returns the
        structured summary, then automatically starts a new window.

        Args:
            detection_result: Dictionary returned by EmotionDetector.process_frame().

        Returns:
            Structured summary dictionary if the window completed, else None.
        """
        # Store frame observation
        self.current_window_observations.append({
            "timestamp": detection_result.get("timestamp", time.time()),
            "face_detected": detection_result.get("face_detected", False),
            "emotion": detection_result.get("emotion"),
            "confidence": float(detection_result.get("confidence", 0.0)),
        })

        # Check if active window time has completed
        elapsed = time.time() - self.window_start_time
        if elapsed >= self.window_seconds:
            summary = self.generate_summary()
            self._reset_current_window()
            return summary

        return None

    def _reset_current_window(self) -> None:
        """Resets the observation buffer and resets the window start timestamp."""
        self.current_window_observations = []
        self.window_start_time = time.time()

    def generate_summary(self) -> Dict[str, Any]:
        """
        Analyzes the current observation buffer and produces a comprehensive summary.
        Can also be invoked manually on demand.

        Returns:
            Structured emotion summary dictionary.
        """
        timestamp = time.time()
        total_frames = len(self.current_window_observations)

        # Filter observations where a face was actually detected
        face_frames = [
            obs for obs in self.current_window_observations
            if obs.get("face_detected") and obs.get("emotion") is not None
        ]
        frames_with_face_count = len(face_frames)

        # Calculate face detection ratio (e.g. 192 / 200 = 0.96)
        face_detected_ratio = (
            round(frames_with_face_count / total_frames, 4) if total_frames > 0 else 0.0
        )

        # Handle edge case: No face detected during the entire window
        if frames_with_face_count == 0:
            dominant_emotion = None
            dominant_confidence = 0.0
            emotion_distribution = {emo: 0.0 for emo in EMOTION_CLASSES}
            emotion_trend = "unknown"
            self.dominant_emotion_duration = 0.0
            self.last_dominant_emotion = None

            summary = {
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

        # 1. Confidence-weighted distribution calculation
        # Each observation contributes its model confidence to that emotion's bucket
        weights: Dict[str, float] = {emo: 0.0 for emo in EMOTION_CLASSES}
        confidences_by_emotion: Dict[str, List[float]] = {emo: [] for emo in EMOTION_CLASSES}

        for obs in face_frames:
            emo = str(obs["emotion"]).lower()
            conf = float(obs["confidence"])
            weights[emo] = weights.get(emo, 0.0) + conf
            confidences_by_emotion.setdefault(emo, []).append(conf)

        total_weight = sum(weights.values())

        # Normalize weights to produce percentage distribution (sums to 1.0)
        emotion_distribution = {
            emo: round(w / total_weight, 4) if total_weight > 0 else 0.0
            for emo, w in weights.items()
        }

        # 2. Dominant emotion (emotion with highest accumulated confidence weight)
        dominant_emotion = max(weights.items(), key=lambda item: item[1])[0]

        # 3. Dominant confidence (average model confidence for dominant emotion detections)
        dom_confs = confidences_by_emotion.get(dominant_emotion, [])
        dominant_confidence = (
            round(sum(dom_confs) / len(dom_confs), 4) if dom_confs else 0.0
        )

        # 4. Observed facial expression trend & persistence tracking
        # Note: Indicates observed facial expression consistency, not internal psychological state.
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

    def get_window_progress(self) -> tuple[float, float]:
        """
        Returns the current elapsed seconds and total window seconds.
        Useful for rendering on-screen HUD progress (e.g. 5.2 / 8.0s).
        """
        elapsed = min(time.time() - self.window_start_time, self.window_seconds)
        return round(elapsed, 1), self.window_seconds

    def format_terminal_summary(self, summary: Optional[Dict[str, Any]] = None) -> str:
        """
        Renders a cleanly formatted multi-line string for terminal inspection.
        """
        s = summary if summary is not None else self.last_summary
        if not s:
            return "[EmotionAggregator] No summary generated yet."

        dom_emo = s.get("dominant_emotion")
        dom_str = dom_emo if dom_emo else "None (No face detected)"
        dom_conf = s.get("dominant_confidence", 0.0)
        face_ratio = int(round(s.get("face_detected_ratio", 0.0) * 100))
        trend = s.get("emotion_trend", "unknown")
        duration = s.get("dominant_emotion_duration_seconds", 0.0)
        window_sec = s.get("window_seconds", self.window_seconds)
        dist = s.get("emotion_distribution", {})

        # Filter and sort distribution (show non-zero / top emotions first)
        sorted_dist = sorted(
            dist.items(), key=lambda x: x[1], reverse=True
        )

        lines = [
            "-" * 42,
            "EMOTION SUMMARY (Observed Facial Expressions)",
            "-" * 42,
            f"Window:        {window_sec:.1f} seconds",
            f"Dominant:      {dom_str}",
            f"Confidence:    {dom_conf:.2f}",
            f"Face detected: {face_ratio}%",
            f"Trend:         {trend}",
            f"Duration:      {duration:.1f} seconds",
            "",
            "Distribution:",
        ]

        for emo, pct in sorted_dist:
            if pct > 0.005:  # Only display classes with >= 0.5% presence
                lines.append(f"  {emo:<12} {int(round(pct * 100)):>3}%")

        lines.append("-" * 42)
        return "\n".join(lines)
