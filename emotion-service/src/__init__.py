"""
Facial Emotion Detection Module.
Real-time YOLO11n-based facial expression detection.
"""

from src.emotion_detector import EmotionDetector
from src.emotion_smoother import EmotionSmoother
from src.emotion_aggregator import EmotionAggregator
from src.config import Config

__all__ = ["EmotionDetector", "EmotionSmoother", "EmotionAggregator", "Config"]
