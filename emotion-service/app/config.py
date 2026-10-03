"""
Application Configuration Module.
Defines environment variables, runtime settings, emotion class mappings,
and path resolution for the Facial Emotion Detection Service.
"""

from pathlib import Path
from typing import Dict, List, Optional
import torch
from pydantic import Field
from pydantic_settings import BaseSettings

# Base directories
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

# Registered emotion classes (ID -> Name)
EMOTION_CLASSES_DICT: Dict[str, str] = {
    "0": "angry",
    "1": "contempt",
    "2": "disgust",
    "3": "fear",
    "4": "happy",
    "5": "natural",
    "6": "sad",
    "7": "sleepy",
    "8": "surprised",
}

EMOTION_CLASSES: List[str] = list(EMOTION_CLASSES_DICT.values())


def get_default_device() -> str:
    """Returns '0' if CUDA is available, else 'cpu'."""
    return "0" if torch.cuda.is_available() else "cpu"


def resolve_model_path(custom_path: Optional[str] = None) -> Path:
    """Resolves and validates the YOLO model weights path."""
    if custom_path:
        p = Path(custom_path)
        if p.exists():
            return p
        raise FileNotFoundError(f"Specified model weights path not found: {p}")

    if PRIMARY_MODEL_PATH.exists():
        return PRIMARY_MODEL_PATH

    if FALLBACK_MODEL_PATH.exists():
        return FALLBACK_MODEL_PATH

    raise FileNotFoundError(
        f"YOLO weights not found at '{PRIMARY_MODEL_PATH}' or '{FALLBACK_MODEL_PATH}'."
    )


class Settings(BaseSettings):
    """
    Application runtime and environment settings.
    """

    SERVICE_NAME: str = "Facial Emotion Detection API"
    SERVICE_VERSION: str = "1.0.0"

    # Model & Inference Defaults
    MODEL_PATH: str = str(PRIMARY_MODEL_PATH if PRIMARY_MODEL_PATH.exists() else FALLBACK_MODEL_PATH)
    CONFIDENCE_THRESHOLD: float = Field(default=0.50, ge=0.0, le=1.0)
    WINDOW_SECONDS: float = Field(default=8.0, ge=5.0, le=60.0)
    CAMERA_INDEX: int = Field(default=0, ge=0)
    DEVICE: str = Field(default_factory=get_default_device)
    INPUT_SIZE: int = 640

    # Server Defaults
    HOST: str = "0.0.0.0"
    PORT: int = 8001
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


# Global settings singleton
settings = Settings()
