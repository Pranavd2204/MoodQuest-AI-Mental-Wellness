"""
Logging configuration for the Facial Emotion Detection Service.
Provides clean, structured logging without frame-level spam.
"""

import logging
import sys


def setup_logger(name: str = "emotion_service") -> logging.Logger:
    """
    Configures and returns a formatted logger.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        logger.propagate = False
    return logger


logger = setup_logger()
