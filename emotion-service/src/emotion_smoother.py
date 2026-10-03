"""
Temporal Emotion Smoothing Module.
Maintains a rolling window of facial expression detections to prevent single-frame
jitter, blinking artifacts, or noisy prediction fluctuations from triggering
erratic state changes in downstream therapy agents.
"""

from collections import Counter, deque
from typing import Any, Dict, List, Optional


class EmotionSmoother:
    """
    Stabilizes raw frame-level emotion detections over time.

    Temporal Smoothing Techniques Supported / Documented:
    1. Rolling Majority Vote (Default):
       Calculates the mode of emotion classes across the recent N frames.
    2. Confidence-Weighted Voting:
       Sums the model confidence scores for each emotion class across the window,
       selecting the emotion with the highest accumulated score.
    3. Exponential Moving Average (EMA) / Temporal Decay (Future upgrade):
       Gives recent frames exponentially higher weight while smoothing older frames.
    4. Hysteresis & State Transition Locking (Future upgrade):
       Requires an emotion to persist for a minimum number of consecutive frames
       (e.g., 5 frames) before switching the active stable state.
    """

    def __init__(
        self,
        window_size: int = 10,
        method: str = "confidence_weighted",
        min_stability_threshold: float = 0.40,
    ):
        """
        Args:
            window_size: Number of recent detection frames to store.
            method: 'majority_vote' or 'confidence_weighted'.
            min_stability_threshold: Minimum fraction of window agreement required
                                    to report a stable emotion.
        """
        self.window_size = window_size
        self.method = method
        self.min_stability_threshold = min_stability_threshold

        # Queue storing tuples of: (emotion_label, confidence, timestamp)
        self.history: deque = deque(maxlen=window_size)
        self.last_stable_emotion: Optional[str] = None
        self.last_stable_confidence: float = 0.0

    def update(self, detection_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Ingests a structured detection result and produces a stabilized emotional state.

        Args:
            detection_result: Dictionary returned by EmotionDetector.process_frame().

        Returns:
            Dictionary containing:
            {
                "stable_emotion": str or None,
                "stable_confidence": float,
                "stability_score": float,  # Percentage agreement across the window (0.0 - 1.0)
                "raw_emotion": str or None,
                "raw_confidence": float,
                "history_length": int,
                "distribution": Dict[str, float]  # Class distribution / weights in window
            }
        """
        raw_emotion = detection_result.get("emotion")
        raw_conf = detection_result.get("confidence", 0.0)
        timestamp = detection_result.get("timestamp")

        # If a face was detected, record it in our rolling history
        if detection_result.get("face_detected") and raw_emotion:
            self.history.append({
                "emotion": raw_emotion,
                "confidence": raw_conf,
                "timestamp": timestamp,
            })

        if not self.history:
            return {
                "stable_emotion": None,
                "stable_confidence": 0.0,
                "stability_score": 0.0,
                "raw_emotion": raw_emotion,
                "raw_confidence": raw_conf,
                "history_length": 0,
                "distribution": {},
            }

        # Calculate smoothed state based on selected method
        if self.method == "majority_vote":
            stable_emotion, avg_conf, stability, dist = self._majority_vote()
        else:
            # Default: confidence_weighted
            stable_emotion, avg_conf, stability, dist = self._confidence_weighted_vote()

        self.last_stable_emotion = stable_emotion
        self.last_stable_confidence = avg_conf

        return {
            "stable_emotion": stable_emotion,
            "stable_confidence": round(avg_conf, 3),
            "stability_score": round(stability, 3),
            "raw_emotion": raw_emotion,
            "raw_confidence": round(raw_conf, 3),
            "history_length": len(self.history),
            "distribution": dist,
        }

    def _majority_vote(self) -> tuple[str, float, float, Dict[str, float]]:
        """
        Calculates the most frequent emotion class in the rolling history.
        """
        emotions = [item["emotion"] for item in self.history]
        counts = Counter(emotions)
        total = len(emotions)

        most_common_emotion, count = counts.most_common(1)[0]
        stability = count / total

        # Compute average confidence for the winning emotion
        winning_confs = [
            item["confidence"] for item in self.history if item["emotion"] == most_common_emotion
        ]
        avg_conf = sum(winning_confs) / len(winning_confs) if winning_confs else 0.0

        dist = {emo: round(cnt / total, 3) for emo, cnt in counts.items()}
        return most_common_emotion, avg_conf, stability, dist

    def _confidence_weighted_vote(self) -> tuple[str, float, float, Dict[str, float]]:
        """
        Weights each emotion by the model's confidence score in the rolling history.
        Gives higher influence to high-certainty detections.
        """
        weight_map: Dict[str, float] = {}
        count_map: Dict[str, int] = {}
        total_weight = 0.0

        for item in self.history:
            emo = item["emotion"]
            conf = item["confidence"]
            weight_map[emo] = weight_map.get(emo, 0.0) + conf
            count_map[emo] = count_map.get(emo, 0) + 1
            total_weight += conf

        if total_weight == 0.0:
            return "natural", 0.0, 0.0, {}

        # Winning emotion has highest accumulated confidence
        winner = max(weight_map.items(), key=lambda x: x[1])[0]
        stability = weight_map[winner] / total_weight
        avg_conf = weight_map[winner] / count_map[winner]

        dist = {emo: round(w / total_weight, 3) for emo, w in weight_map.items()}
        return winner, avg_conf, stability, dist

    def reset(self) -> None:
        """Clears the temporal window history."""
        self.history.clear()
        self.last_stable_emotion = None
        self.last_stable_confidence = 0.0
