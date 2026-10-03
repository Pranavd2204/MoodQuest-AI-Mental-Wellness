"""
Webcam Background Worker Service.
Manages asynchronous webcam video capture, real-time inference execution,
frame observation broadcasting, and 8-second aggregation summaries.
"""

import sys
import threading
import time
from typing import Optional
import cv2


from app.config import settings
from app.services.emotion_detector import EmotionDetectorService
from app.services.session_manager import SessionState, session_manager
from app.utils.logging import logger


class WebcamWorker(threading.Thread):
    """
    Dedicated background thread for webcam capture and YOLO inference per active session.
    """

    def __init__(
        self,
        session: SessionState,
        detector: EmotionDetectorService,
        camera_index: int = 0,
    ):
        super().__init__(daemon=True, name=f"WebcamWorker-{session.session_id[:8]}")
        self.session = session
        self.detector = detector
        self.camera_index = camera_index
        self._stop_event = threading.Event()
        self._pause_event = threading.Event()  # If set, worker is paused
        self.cap: Optional[cv2.VideoCapture] = None
        self.running = False

    def stop(self) -> None:
        """Signals the background thread to terminate and release resources."""
        self._stop_event.set()
        self._pause_event.clear()

    def pause(self) -> None:
        """Signals worker to pause frame processing."""
        self._pause_event.set()

    def resume(self) -> None:
        """Signals worker to resume frame processing."""
        self._pause_event.clear()

    def run(self) -> None:
        logger.info(f"[{self.name}] Starting webcam worker on camera index {self.camera_index}...")
        self.running = True

        try:
            # On Windows, cv2.CAP_DSHOW provides fast, reliable DirectShow camera capture
            if sys.platform.startswith("win"):
                self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
            else:
                self.cap = cv2.VideoCapture(self.camera_index)

            if not self.cap.isOpened():
                # Fallback to default backend if DSHOW failed
                self.cap = cv2.VideoCapture(self.camera_index)

            if not self.cap.isOpened():
                logger.error(
                    f"[{self.name}] Failed to open camera device at index {self.camera_index}."
                )
                self.session.set_stopped()
                session_manager.clear_active_camera_session(self.session.session_id)
                return


            self.session.set_running()
            logger.info(f"[{self.name}] Webcam monitoring started successfully.")

            while not self._stop_event.is_set():
                if self._pause_event.is_set():
                    time.sleep(0.05)
                    continue

                ret, frame = self.cap.read()
                if not ret or frame is None:
                    time.sleep(0.02)
                    continue

                # Mirror frame horizontally
                frame = cv2.flip(frame, 1)

                # Process frame through YOLO detector
                obs = self.detector.process_frame(frame)

                # Atomically update session's most recent observation
                self.session.update_observation(obs)

                # Feed observation to 8s aggregation buffer
                summary = self.session.aggregator.add_observation(obs)
                if summary:
                    self.session.add_summary(summary)
                    dom = summary.get("dominant_emotion")
                    conf = summary.get("dominant_confidence", 0.0)
                    dur = summary.get("dominant_emotion_duration_seconds", 0.0)
                    logger.info(
                        f"[{self.name}] Emotion Summary generated: "
                        f"Dominant={dom} (conf={conf:.2f}, duration={dur:.1f}s, trend={summary.get('emotion_trend')})"
                    )

                # Yield small slice to prevent thread starvation
                time.sleep(0.005)

        except Exception as e:
            logger.error(f"[{self.name}] Exception in webcam loop: {e}", exc_info=True)
        finally:
            self.running = False
            if self.cap is not None and self.cap.isOpened():
                self.cap.release()
                logger.info(f"[{self.name}] Webcam device released cleanly.")
            self.session.set_stopped()
            session_manager.clear_active_camera_session(self.session.session_id)
            logger.info(f"[{self.name}] Worker terminated.")


class WebcamService:
    """
    Coordinates active webcam worker lifecycle and enforces physical camera ownership.
    """

    def __init__(self, detector: EmotionDetectorService):
        self.detector = detector
        self._current_worker: Optional[WebcamWorker] = None
        self._lock = threading.Lock()

    def start_monitoring(
        self, session: SessionState, camera_index: Optional[int] = None
    ) -> None:
        """
        Starts webcam monitoring for the specified session in a background thread.
        Raises RuntimeError if another session already owns the camera.
        """
        cam_idx = camera_index if camera_index is not None else settings.CAMERA_INDEX

        with self._lock:
            # Check if active worker is already running
            if self._current_worker is not None and self._current_worker.is_alive():
                active_sid = session_manager.get_active_camera_session_id()
                if active_sid and active_sid != session.session_id:
                    raise RuntimeError("Webcam is already being used by another session.")
                if active_sid == session.session_id:
                    raise RuntimeError("Webcam monitoring is already active for this session.")

            session_manager.set_active_camera_session(session.session_id)
            worker = WebcamWorker(
                session=session,
                detector=self.detector,
                camera_index=cam_idx,
            )
            self._current_worker = worker
            worker.start()

    def stop_monitoring(self, session: SessionState) -> None:
        """
        Stops active monitoring and releases camera hardware.
        """
        with self._lock:
            if self._current_worker is not None:
                self._current_worker.stop()
                self._current_worker.join(timeout=3.0)
                self._current_worker = None
            session.set_stopped()
            session_manager.clear_active_camera_session(session.session_id)

    def pause_monitoring(self, session: SessionState) -> None:
        """Pauses frame capture without releasing camera."""
        with self._lock:
            if self._current_worker is not None and self._current_worker.is_alive():
                self._current_worker.pause()
            session.set_paused()

    def resume_monitoring(self, session: SessionState) -> None:
        """Resumes paused monitoring."""
        with self._lock:
            if self._current_worker is not None and self._current_worker.is_alive():
                self._current_worker.resume()
            session.set_running()

    def is_camera_in_use(self) -> bool:
        """Returns True if a webcam worker is actively capturing frames."""
        with self._lock:
            return self._current_worker is not None and self._current_worker.is_alive()

    def is_camera_available(self) -> bool:
        """
        Lightweight check: returns True if camera is configured and available for capture.
        Does not open/lock the physical hardware during health checks.
        """
        return settings.CAMERA_INDEX >= 0

