"""
Configuration Module for Emotion Detection.
Defines model paths, inference hyperparameters, color mappings, and hardware defaults.
"""

from pathlib import Path
import torch

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
PRIMARY_MODEL_PATH = BASE_DIR / "models" / "best.pt"
FALLBACK_MODEL_PATH = (
    BASE_DIR
    / "runs"
    / "detect"
    / "emotion_training"
    / "facial_expression_yolo"
    / "weights"
    / "best.pt"
)

# Model Settings
DEFAULT_IMG_SIZE = 640
DEFAULT_CONF_THRESHOLD = 0.50
DEFAULT_IOU_THRESHOLD = 0.45

# Video / Webcam Settings
DEFAULT_CAMERA_INDEX = 0
FRAME_WIDTH = 1280
FRAME_HEIGHT = 720

# Aggregation Settings
DEFAULT_WINDOW_SECONDS = 8.0  # Time window in seconds for emotion aggregation

# All 9 trained emotion classes
EMOTION_CLASSES = [
    "angry",
    "contempt",
    "disgust",
    "fear",
    "happy",
    "natural",
    "sad",
    "sleepy",
    "surprised",
]

# Temporal Smoothing Settings
DEFAULT_SMOOTHING_WINDOW = 10  # Number of frames for rolling window

# Modern BGR color palette for visualization (OpenCV uses BGR)
EMOTION_COLORS = {
    "angry": (34, 34, 220),       # Vibrant Red
    "contempt": (0, 140, 255),    # Dark Orange
    "disgust": (45, 110, 80),     # Earthy Dark Green
    "fear": (180, 50, 160),       # Purple / Magenta
    "happy": (60, 200, 60),       # Bright Emerald Green
    "natural": (230, 180, 50),    # Sky Blue / Cyan
    "sad": (220, 120, 40),        # Deep Blue
    "sleepy": (180, 160, 120),    # Slate / Teal Gray
    "surprised": (20, 220, 255),  # Bright Yellow / Gold
    "default": (200, 200, 200),   # Light Gray
}


class Config:
    """Namespace for application settings and hyperparameters."""
    BASE_DIR = BASE_DIR
    PRIMARY_MODEL_PATH = PRIMARY_MODEL_PATH
    FALLBACK_MODEL_PATH = FALLBACK_MODEL_PATH
    DEFAULT_IMG_SIZE = DEFAULT_IMG_SIZE
    DEFAULT_CONF_THRESHOLD = DEFAULT_CONF_THRESHOLD
    DEFAULT_IOU_THRESHOLD = DEFAULT_IOU_THRESHOLD
    DEFAULT_CAMERA_INDEX = DEFAULT_CAMERA_INDEX
    FRAME_WIDTH = FRAME_WIDTH
    FRAME_HEIGHT = FRAME_HEIGHT
    DEFAULT_WINDOW_SECONDS = DEFAULT_WINDOW_SECONDS
    DEFAULT_SMOOTHING_WINDOW = DEFAULT_SMOOTHING_WINDOW
    EMOTION_CLASSES = EMOTION_CLASSES
    EMOTION_COLORS = EMOTION_COLORS


def get_default_device() -> str:
    """
    Determines the best available device for inference.
    Returns '0' for CUDA GPU if available, else 'cpu'.
    """
    if torch.cuda.is_available():
        return "0"
    return "cpu"


def resolve_model_path(custom_path: str | Path | None = None) -> Path:
    """
    Resolves and validates the YOLO model weights path.
    """
    if custom_path:
        p = Path(custom_path)
        if p.exists():
            return p
        raise FileNotFoundError(f"Specified model file not found: {p}")

    if PRIMARY_MODEL_PATH.exists():
        return PRIMARY_MODEL_PATH

    if FALLBACK_MODEL_PATH.exists():
        return FALLBACK_MODEL_PATH

    raise FileNotFoundError(
        f"YOLO model weights not found at '{PRIMARY_MODEL_PATH}' or '{FALLBACK_MODEL_PATH}'. "
        "Please ensure best.pt is present in models/ directory."
    )

