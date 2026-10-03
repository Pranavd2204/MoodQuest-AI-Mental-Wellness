"""
Emotion Detector Service.
Encapsulates YOLO11n inference, GPU acceleration, and frame processing.
"""

import threading
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import numpy as np
import torch
from ultralytics import YOLO

from app.config import (
    EMOTION_CLASSES_DICT,
    get_default_device,
    resolve_model_path,
    settings,
)
from app.utils.logging import logger


class EmotionDetectorService:
    """
    Thread-safe YOLO11n facial emotion detector service.
    Loads model once at application startup.
    """

    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        conf_threshold: Optional[float] = None,
        device: Optional[str] = None,
        imgsz: int = 640,
    ):
        self.conf_threshold = (
            conf_threshold if conf_threshold is not None else settings.CONFIDENCE_THRESHOLD
        )
        self.imgsz = imgsz
        self.model_path = resolve_model_path(model_path or settings.MODEL_PATH)
        self.device = device if device is not None else (settings.DEVICE or get_default_device())
        self._lock = threading.Lock()

        logger.info(f"Loading YOLO11n model from '{self.model_path}' on device '{self.device}'...")
        try:
            self.model = YOLO(str(self.model_path))
            self.class_names = self.model.names if hasattr(self.model, "names") else EMOTION_CLASSES_DICT
            # Model warm-up on target device to avoid first-frame latency
            dummy_frame = np.zeros((self.imgsz, self.imgsz, 3), dtype=np.uint8)
            _ = self.model.predict(
                source=dummy_frame,
                imgsz=self.imgsz,
                conf=self.conf_threshold,
                device=self.device,
                verbose=False,
            )
            logger.info(f"Model loaded and warmed up successfully. Registered classes: {self.class_names}")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise RuntimeError(f"Failed to load YOLO model: {e}") from e


    def set_confidence_threshold(self, conf: float) -> None:
        """Updates confidence threshold dynamically."""
        with self._lock:
            self.conf_threshold = conf

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Runs YOLO emotion detection on a single OpenCV BGR frame.
        """
        if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
            return []

        with self._lock:
            try:
                results = self.model.predict(
                    source=frame,
                    imgsz=self.imgsz,
                    conf=self.conf_threshold,
                    device=self.device,
                    verbose=False,
                )
            except Exception as e:
                logger.error(f"Inference error on frame: {e}")
                return []

        detections: List[Dict[str, Any]] = []
        if not results:
            return detections

        res = results[0]
        if res.boxes is None or len(res.boxes) == 0:
            return detections

        boxes = res.boxes.xyxy.cpu().numpy()
        confs = res.boxes.conf.cpu().numpy()
        classes = res.boxes.cls.cpu().numpy().astype(int)

        for box, conf, cls_id in zip(boxes, confs, classes):
            x1, y1, x2, y2 = [int(v) for v in box]
            emotion_label = self.class_names.get(cls_id, str(cls_id))
            detections.append({
                "emotion": emotion_label,
                "confidence": float(conf),
                "bbox": [x1, y1, x2, y2],
                "class_id": int(cls_id),
            })

        # Primary face: sort descending by confidence
        detections.sort(key=lambda d: d["confidence"], reverse=True)
        return detections

    def process_frame(self, frame: np.ndarray, timestamp: Optional[float] = None) -> Dict[str, Any]:
        """
        Runs inference and structures the result for aggregation and API consumption.
        """
        import time
        ts = timestamp if timestamp is not None else time.time()
        detections = self.detect(frame)

        if detections:
            primary = detections[0]
            return {
                "timestamp": ts,
                "face_detected": True,
                "emotion": primary["emotion"],
                "confidence": primary["confidence"],
                "bbox": primary["bbox"],
                "class_id": primary["class_id"],
                "all_detections": detections,
                "num_faces": len(detections),
            }

        return {
            "timestamp": ts,
            "face_detected": False,
            "emotion": None,
            "confidence": 0.0,
            "bbox": [],
            "class_id": None,
            "all_detections": [],
            "num_faces": 0,
        }
