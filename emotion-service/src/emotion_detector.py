"""
Emotion Detector Module.
Encapsulates YOLO11n model loading, device selection, frame inference,
and structured prediction output.
"""

import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import numpy as np
import torch
import ultralytics
from ultralytics import YOLO

from src.config import (
    DEFAULT_CONF_THRESHOLD,
    DEFAULT_IMG_SIZE,
    DEFAULT_IOU_THRESHOLD,
    get_default_device,
    resolve_model_path,
)


class EmotionDetector:
    """
    Perception engine for real-time facial expression and emotion detection.
    Loads YOLO11n weights once at startup and performs structured inference on input frames.
    """

    def __init__(
        self,
        model_path: Optional[Union[str, Path]] = None,
        conf_threshold: float = DEFAULT_CONF_THRESHOLD,
        imgsz: int = DEFAULT_IMG_SIZE,
        device: Optional[str] = None,
        iou_threshold: float = DEFAULT_IOU_THRESHOLD,
        verbose_startup: bool = True,
    ):
        self.conf_threshold = conf_threshold
        self.imgsz = imgsz
        self.iou_threshold = iou_threshold

        # 1. Resolve and validate model path
        self.model_path = resolve_model_path(model_path)

        # 2. Resolve hardware device (CUDA 0 vs CPU fallback)
        self.device = device if device is not None else get_default_device()

        # 3. Log startup environment details
        if verbose_startup:
            self._log_startup_environment()

        # 4. Load YOLO model
        try:
            self.model = YOLO(str(self.model_path))
            # Warm up or verify model class names
            self.class_names = self.model.names
        except Exception as e:
            raise RuntimeError(
                f"Failed to load YOLO model from '{self.model_path}': {e}"
            ) from e

        if verbose_startup:
            print("=" * 60)
            print(f"[Detector] Model loaded successfully from: {self.model_path}")
            print(f"[Detector] Registered Emotion Classes ({len(self.class_names)}): {self.class_names}")
            print("=" * 60 + "\n")

    def _log_startup_environment(self) -> None:
        """
        Prints detailed system, hardware, PyTorch, and Ultralytics diagnostic information.
        """
        cuda_avail = torch.cuda.is_available()
        gpu_name = torch.cuda.get_device_name(0) if cuda_avail else "N/A"
        cuda_ver = torch.version.cuda if cuda_avail else "N/A"

        print("=" * 60)
        print("FACIAL EMOTION DETECTION MODULE - INITIALIZATION")
        print("=" * 60)
        print(f" Python Version      : {sys.version.split()[0]}")
        print(f" PyTorch Version     : {torch.__version__}")
        print(f" CUDA Available      : {cuda_avail}")
        print(f" CUDA Version        : {cuda_ver}")
        print(f" GPU Device Name     : {gpu_name}")
        print(f" Ultralytics Version : {ultralytics.__version__}")
        print(f" Target Inference Dev: {'CUDA ' + self.device if self.device != 'cpu' else 'CPU'}")
        print(f" Confidence Threshold: {self.conf_threshold:.2f}")
        print(f" Inference Image Size: {self.imgsz}x{self.imgsz}")
        print("=" * 60)

    def detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """
        Runs YOLO emotion detection on a single frame.

        Args:
            frame: Numpy BGR image array from OpenCV.

        Returns:
            List of structured detection dictionaries:
            [
                {
                    "emotion": "happy",
                    "confidence": 0.92,
                    "bbox": [x1, y1, x2, y2],
                    "class_id": 4
                },
                ...
            ]
        """
        if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
            return []

        try:
            results = self.model.predict(
                source=frame,
                imgsz=self.imgsz,
                conf=self.conf_threshold,
                iou=self.iou_threshold,
                device=self.device,
                verbose=False,
            )
        except Exception as e:
            print(f"[Detector Error] Inference failed on frame: {e}", file=sys.stderr)
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
            emotion_label = self.class_names.get(cls_id, f"class_{cls_id}")
            detections.append(
                {
                    "emotion": emotion_label,
                    "confidence": float(conf),
                    "bbox": [x1, y1, x2, y2],
                    "class_id": int(cls_id),
                }
            )

        # Sort detections descending by confidence so the primary face is first
        detections.sort(key=lambda d: d["confidence"], reverse=True)
        return detections

    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """
        Runs inference and packages the result into a clean, structured payload
        ready for temporal smoothing and downstream therapy/chat backend consumption.

        Returns:
            {
                "timestamp": 1712345678.912,
                "face_detected": True,
                "emotion": "happy",
                "confidence": 0.92,
                "bbox": [120, 80, 420, 430],
                "class_id": 4,
                "all_detections": [...],
                "num_faces": 1
            }
        """
        timestamp = time.time()
        detections = self.detect(frame)

        if detections:
            primary = detections[0]
            return {
                "timestamp": timestamp,
                "face_detected": True,
                "emotion": primary["emotion"],
                "confidence": primary["confidence"],
                "bbox": primary["bbox"],
                "class_id": primary["class_id"],
                "all_detections": detections,
                "num_faces": len(detections),
            }

        return {
            "timestamp": timestamp,
            "face_detected": False,
            "emotion": None,
            "confidence": 0.0,
            "bbox": [],
            "class_id": None,
            "all_detections": [],
            "num_faces": 0,
        }
