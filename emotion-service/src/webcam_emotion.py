"""
Real-time Webcam Facial Emotion Detection Application.
Handles video stream capture, real-time FPS calculation, YOLO11n inference,
continuous emotion monitoring and aggregation across a rolling time window (e.g. 8s),
OpenCV visualization overlay, and graceful resource cleanup.
"""

import argparse
import sys
import time
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np

from src.config import (
    DEFAULT_CAMERA_INDEX,
    DEFAULT_CONF_THRESHOLD,
    DEFAULT_IMG_SIZE,
    DEFAULT_SMOOTHING_WINDOW,
    DEFAULT_WINDOW_SECONDS,
    EMOTION_COLORS,
    FRAME_HEIGHT,
    FRAME_WIDTH,
)
from src.emotion_detector import EmotionDetector
from src.emotion_smoother import EmotionSmoother
from src.emotion_aggregator import EmotionAggregator


class FPSCounter:
    """
    Computes smooth, rolling real-time Frames Per Second (FPS).
    """

    def __init__(self, smoothing_factor: float = 0.9):
        self.smoothing_factor = smoothing_factor
        self.prev_time = time.time()
        self.fps = 0.0

    def update(self) -> float:
        current_time = time.time()
        delta = current_time - self.prev_time
        self.prev_time = current_time

        if delta > 0:
            instant_fps = 1.0 / delta
            if self.fps == 0.0:
                self.fps = instant_fps
            else:
                self.fps = (self.smoothing_factor * self.fps) + (
                    (1.0 - self.smoothing_factor) * instant_fps
                )
        return self.fps


def draw_corner_rect(
    img: np.ndarray,
    bbox: List[int],
    color: Tuple[int, int, int],
    thickness: int = 2,
    corner_len: int = 20,
) -> None:
    """
    Draws a bounding box with accented corner brackets for a sleek, modern look.
    """
    x1, y1, x2, y2 = bbox
    # Main rectangle (subtle)
    cv2.rectangle(img, (x1, y1), (x2, y2), color, thickness)

    # Accent corners (bolder)
    accent_thick = thickness + 2
    # Top-Left
    cv2.line(img, (x1, y1), (x1 + corner_len, y1), color, accent_thick)
    cv2.line(img, (x1, y1), (x1, y1 + corner_len), color, accent_thick)
    # Top-Right
    cv2.line(img, (x2, y1), (x2 - corner_len, y1), color, accent_thick)
    cv2.line(img, (x2, y1), (x2, y1 + corner_len), color, accent_thick)
    # Bottom-Left
    cv2.line(img, (x1, y2), (x1 + corner_len, y2), color, accent_thick)
    cv2.line(img, (x1, y2), (x1, y2 - corner_len), color, accent_thick)
    # Bottom-Right
    cv2.line(img, (x2, y2), (x2 - corner_len, y2), color, accent_thick)
    cv2.line(img, (x2, y2), (x2, y2 - corner_len), color, accent_thick)


def draw_detection_overlay(
    frame: np.ndarray,
    detection: Dict,
    color: Tuple[int, int, int],
    is_primary: bool = True,
) -> None:
    """
    Renders bounding box, emotion tag label, and confidence score on the frame.
    """
    bbox = detection["bbox"]
    x1, y1, x2, y2 = bbox
    emotion = detection["emotion"].upper()
    confidence = int(round(detection["confidence"] * 100))

    label = f"{emotion} {confidence}%"

    # Draw bounding box
    draw_corner_rect(frame, bbox, color, thickness=2, corner_len=18)

    # Draw emotion label badge above bounding box
    font = cv2.FONT_HERSHEY_DUPLEX
    font_scale = 0.65
    font_thick = 1

    (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, font_thick)
    label_y1 = max(y1 - text_h - 12, 0)
    label_y2 = y1

    # Draw badge background
    cv2.rectangle(
        frame,
        (x1, label_y1),
        (x1 + text_w + 14, label_y2),
        color,
        -1,
    )

    # Contrast text color (white text)
    text_color = (255, 255, 255) if color != (20, 220, 255) else (20, 20, 20)
    cv2.putText(
        frame,
        label,
        (x1 + 7, label_y2 - 6),
        font,
        font_scale,
        text_color,
        font_thick,
        cv2.LINE_AA,
    )


def draw_hud(
    frame: np.ndarray,
    fps: float,
    device_name: str,
    aggregator: EmotionAggregator,
    smoothed_state: Dict,
) -> None:
    """
    Renders top status banner displaying FPS, hardware device, monitoring status,
    window time progress, and aggregated dominant emotion.
    """
    h, w = frame.shape[:2]
    # Semi-transparent top bar
    bar_height = 48
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, bar_height), (18, 18, 22), -1)
    cv2.addWeighted(overlay, 0.80, frame, 0.20, 0, frame)

    font = cv2.FONT_HERSHEY_SIMPLEX
    small_font = cv2.FONT_HERSHEY_DUPLEX

    # 1. Left: FPS & Hardware Device info
    fps_text = f"FPS: {fps:.1f}"
    dev_text = f"[{device_name}]"
    cv2.putText(frame, fps_text, (14, 30), small_font, 0.65, (0, 255, 180), 1, cv2.LINE_AA)
    cv2.putText(frame, dev_text, (130, 30), font, 0.50, (180, 180, 180), 1, cv2.LINE_AA)

    # 2. Center: Monitoring Status & Window Progress
    elapsed, total_win = aggregator.get_window_progress()
    progress_str = f"Monitoring: ACTIVE | Win: {elapsed:.1f}/{total_win:.1f}s"
    cv2.putText(frame, progress_str, (320, 30), small_font, 0.55, (220, 220, 220), 1, cv2.LINE_AA)

    # 3. Right: Dominant Emotion from last summary (or rolling state)
    last_summary = aggregator.last_summary
    if last_summary and last_summary.get("dominant_emotion"):
        dom_emo = last_summary["dominant_emotion"]
        dom_conf = int(round(last_summary.get("dominant_confidence", 0.0) * 100))
        duration = int(round(last_summary.get("dominant_emotion_duration_seconds", 0.0)))
        state_str = f"Summary: {dom_emo.upper()} ({dom_conf}%) [{duration}s]"
        color = EMOTION_COLORS.get(dom_emo.lower(), (0, 255, 0))
    else:
        # If first window hasn't completed yet, show current smoothed status
        stable_emo = smoothed_state.get("stable_emotion")
        if stable_emo:
            stable_conf = int(round(smoothed_state.get("stable_confidence", 0.0) * 100))
            state_str = f"Current: {stable_emo.upper()} ({stable_conf}%)"
            color = EMOTION_COLORS.get(stable_emo.lower(), (0, 255, 0))
        else:
            state_str = "Searching for Face..."
            color = (150, 150, 150)

    (s_w, _), _ = cv2.getTextSize(state_str, small_font, 0.6, 1)
    cv2.putText(frame, state_str, (w - s_w - 16, 30), small_font, 0.6, color, 1, cv2.LINE_AA)


def run_webcam(
    camera_id: int = DEFAULT_CAMERA_INDEX,
    conf_threshold: float = DEFAULT_CONF_THRESHOLD,
    model_path: Optional[str] = None,
    device: Optional[str] = None,
    window_seconds: float = DEFAULT_WINDOW_SECONDS,
    window_size: int = DEFAULT_SMOOTHING_WINDOW,
) -> None:
    """
    Main loop for real-time webcam facial emotion detection and continuous aggregation.
    """
    # 1. Initialize Emotion Detector
    try:
        detector = EmotionDetector(
            model_path=model_path,
            conf_threshold=conf_threshold,
            device=device,
            imgsz=DEFAULT_IMG_SIZE,
            verbose_startup=True,
        )
    except Exception as e:
        print(f"\n[Fatal Error] Unable to initialize EmotionDetector: {e}", file=sys.stderr)
        sys.exit(1)

    # 2. Initialize Temporal Smoother and Emotion Aggregator
    smoother = EmotionSmoother(window_size=window_size)
    aggregator = EmotionAggregator(window_seconds=window_seconds)
    fps_counter = FPSCounter()

    # 3. Open Webcam
    print(f"[Camera] Opening webcam index {camera_id}...")
    cap = cv2.VideoCapture(camera_id)

    if not cap.isOpened():
        print(
            f"\n[Error] Could not open webcam at index {camera_id}.\n"
            "Please check:\n"
            " 1. Is your webcam connected and permitted in Windows privacy settings?\n"
            " 2. Is another application (e.g. Zoom, Teams, Camera App) currently using it?\n"
            " 3. Try specifying a different index using '--camera-id 1'.\n",
            file=sys.stderr,
        )
        return

    # Attempt to set comfortable resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, FRAME_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, FRAME_HEIGHT)

    # Determine display device name
    dev_str = "CUDA: RTX 3050" if detector.device != "cpu" else "CPU"

    window_name = "Facial Emotion Detection - Real-Time YOLO11n"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 960, 640)

    print("\n[Application] Webcam running successfully.")
    print(f"[Application] Continuous monitoring active (Aggregation Window: {window_seconds:.1f}s).")
    print(" >>> Press 'Q' or 'ESC' on the video window to quit cleanly.\n")

    try:
        while True:
            ret, frame = cap.read()
            if not ret or frame is None:
                print("[Warning] Failed to grab frame from webcam. Retrying...")
                time.sleep(0.01)
                continue

            # Flip horizontally for natural mirror view
            frame = cv2.flip(frame, 1)

            # Run detection & structure payload
            frame_payload = detector.process_frame(frame)

            # Update temporal smoother (frame-to-frame stabilization)
            smoothed_state = smoother.update(frame_payload)

            # Update continuous aggregator (temporal window summary)
            summary = aggregator.add_observation(frame_payload)
            if summary is not None:
                # Print clean, formatted summary to terminal on window completion
                print("\n" + aggregator.format_terminal_summary(summary) + "\n")

            # Draw detections
            for idx, det in enumerate(frame_payload["all_detections"]):
                emo_name = det["emotion"].lower()
                color = EMOTION_COLORS.get(emo_name, EMOTION_COLORS["default"])
                is_primary = idx == 0
                draw_detection_overlay(frame, det, color, is_primary=is_primary)

            # Calculate FPS
            fps = fps_counter.update()

            # Render top dashboard / HUD
            draw_hud(frame, fps, dev_str, aggregator, smoothed_state)

            # Display frame
            cv2.imshow(window_name, frame)

            # Check keyboard input (1 ms wait)
            key = cv2.waitKey(1) & 0xFF
            if key in [ord("q"), ord("Q"), 27]:  # 'q', 'Q', or ESC
                print("[Application] Exit signal received. Shutting down...")
                break

            # Check if user closed the OpenCV window via 'X' button
            if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
                print("[Application] Window closed by user. Exiting...")
                break

    except KeyboardInterrupt:
        print("\n[Application] Interrupted by user (Ctrl+C). Cleaning up...")

    except Exception as e:
        print(f"\n[Unexpected Error] An error occurred in webcam loop: {e}", file=sys.stderr)

    finally:
        # Guarantee resource release
        print("[Application] Releasing webcam and destroying OpenCV windows...")
        if cap is not None and cap.isOpened():
            cap.release()
        cv2.destroyAllWindows()
        print("[Application] Cleanup complete. Goodbye!")


def main():
    parser = argparse.ArgumentParser(
        description="Real-Time Facial Emotion Detection with YOLO11n and Continuous Aggregation"
    )
    parser.add_argument(
        "--camera-id",
        type=int,
        default=DEFAULT_CAMERA_INDEX,
        help="Index of the camera device (default: 0)",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=DEFAULT_CONF_THRESHOLD,
        help=f"Confidence threshold for detections (default: {DEFAULT_CONF_THRESHOLD})",
    )
    parser.add_argument(
        "--model",
        type=str,
        default=None,
        help="Optional custom path to YOLO weights (.pt)",
    )
    parser.add_argument(
        "--device",
        type=str,
        default=None,
        help="Inference device: '0' for CUDA GPU, 'cpu' for CPU (default: auto)",
    )
    parser.add_argument(
        "--window-seconds",
        type=float,
        default=DEFAULT_WINDOW_SECONDS,
        help=f"Duration in seconds for the aggregation window (default: {DEFAULT_WINDOW_SECONDS})",
    )
    parser.add_argument(
        "--window-size",
        type=int,
        default=DEFAULT_SMOOTHING_WINDOW,
        help=f"Number of frames for rolling temporal smoothing (default: {DEFAULT_SMOOTHING_WINDOW})",
    )

    args = parser.parse_args()

    run_webcam(
        camera_id=args.camera_id,
        conf_threshold=args.conf,
        model_path=args.model,
        device=args.device,
        window_seconds=args.window_seconds,
        window_size=args.window_size,
    )


if __name__ == "__main__":
    main()
