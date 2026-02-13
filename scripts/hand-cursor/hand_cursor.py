#!/usr/bin/env python3
"""
Hand Cursor — Control your cursor with hand gestures via webcam.

Uses MediaPipe HandLandmarker (Tasks API) for real-time hand tracking,
with gesture recognition for clicking, scrolling, and pausing.
Cursor movement is smoothed using One Euro Filter and mapped to screen
coordinates via Quartz CoreGraphics.

Gestures:
  - Index finger pointing → cursor movement
  - Thumb + Index pinch    → left click
  - Thumb + Middle pinch   → right click
  - Thumb + Ring pinch     → scroll mode (move hand up/down)
  - Fist                   → pause tracking
  - Open palm              → resume tracking

Optimized for macOS + Apple Silicon.
"""

from __future__ import annotations

import os
import sys
import time
import signal
import logging
from pathlib import Path
from typing import Optional
from dataclasses import dataclass

import cv2
import numpy as np
import yaml
import mediapipe as mp

from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

from smoothing import CursorSmoother
from gestures import GestureDetector, GestureType, LM
from calibration import ScreenMapper, get_screen_size

# ─── Logging ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("hand-cursor")

# ─── Constants ──────────────────────────────────────────────────────────────

VERSION = "1.0.0"
CONFIG_PATH = Path(__file__).parent / "config.yaml"
MODEL_PATH = Path(__file__).parent / "hand_landmarker.task"

# Gesture → display label and color (BGR)
GESTURE_DISPLAY = {
    GestureType.NONE: ("", (200, 200, 200)),
    GestureType.PINCH: ("LEFT CLICK", (0, 255, 0)),
    GestureType.RIGHT_CLICK: ("RIGHT CLICK", (0, 165, 255)),
    GestureType.SCROLL: ("SCROLL", (255, 200, 0)),
    GestureType.FIST: ("PAUSED", (0, 0, 255)),
    GestureType.OPEN_PALM: ("TRACKING", (0, 255, 0)),
}

# ─── macOS Cursor Control ───────────────────────────────────────────────────

try:
    from Quartz.CoreGraphics import (
        CGEventCreateMouseEvent,
        CGEventPost,
        CGEventCreateScrollWheelEvent,
        kCGEventMouseMoved,
        kCGEventLeftMouseDown,
        kCGEventLeftMouseUp,
        kCGEventRightMouseDown,
        kCGEventRightMouseUp,
        kCGMouseButtonLeft,
        kCGMouseButtonRight,
        kCGHIDEventTap,
        kCGScrollEventUnitLine,
    )
    HAS_QUARTZ = True
except ImportError:
    HAS_QUARTZ = False
    log.warning("Quartz not available — cursor control disabled (preview only)")


def move_cursor(x: float, y: float):
    """Move the macOS cursor to (x, y) screen coordinates."""
    if not HAS_QUARTZ:
        return
    event = CGEventCreateMouseEvent(
        None, kCGEventMouseMoved, (x, y), kCGMouseButtonLeft
    )
    CGEventPost(kCGHIDEventTap, event)


def click_mouse(x: float, y: float, button: str = "left"):
    """Perform a mouse click at (x, y)."""
    if not HAS_QUARTZ:
        return
    if button == "right":
        down_type = kCGEventRightMouseDown
        up_type = kCGEventRightMouseUp
        btn = kCGMouseButtonRight
    else:
        down_type = kCGEventLeftMouseDown
        up_type = kCGEventLeftMouseUp
        btn = kCGMouseButtonLeft

    event_down = CGEventCreateMouseEvent(None, down_type, (x, y), btn)
    CGEventPost(kCGHIDEventTap, event_down)
    time.sleep(0.02)
    event_up = CGEventCreateMouseEvent(None, up_type, (x, y), btn)
    CGEventPost(kCGHIDEventTap, event_up)


def scroll_mouse(delta_y: float):
    """Scroll the mouse wheel."""
    if not HAS_QUARTZ:
        return
    scroll_amount = int(delta_y)
    if scroll_amount == 0:
        return
    event = CGEventCreateScrollWheelEvent(
        None, kCGScrollEventUnitLine, 1, scroll_amount
    )
    CGEventPost(kCGHIDEventTap, event)


# ─── Configuration ──────────────────────────────────────────────────────────


def load_config() -> dict:
    """Load configuration from config.yaml."""
    defaults = {
        "camera": {"device": 0, "width": 640, "height": 480, "fps": 30},
        "tracking": {
            "max_hands": 1,
            "detection_confidence": 0.7,
            "tracking_confidence": 0.5,
        },
        "gestures": {
            "pinch_threshold": 0.045,
            "right_click_threshold": 0.045,
            "scroll_threshold": 0.045,
            "fist_pause": True,
            "pinch_frames": 2,
            "release_frames": 2,
        },
        "cursor": {
            "sensitivity": 1.8,
            "dead_zone": 3,
            "screen_padding": 0.10,
        },
        "smoothing": {"min_cutoff": 1.5, "beta": 0.5, "d_cutoff": 1.0},
        "display": {
            "show_preview": True,
            "show_landmarks": True,
            "show_gestures": True,
            "preview_width": 400,
        },
    }

    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r") as f:
            user_cfg = yaml.safe_load(f) or {}
        for section, section_defaults in defaults.items():
            if section in user_cfg and isinstance(section_defaults, dict):
                section_defaults.update(user_cfg[section])
                defaults[section] = section_defaults

    return defaults


# ─── Landmark Wrapper ────────────────────────────────────────────────────────

@dataclass
class LandmarkPoint:
    """Simple wrapper to give Tasks API landmarks an attribute-access interface
    compatible with our gestures module."""
    x: float
    y: float
    z: float


def wrap_landmarks(hand_landmarks) -> list:
    """Convert MediaPipe Tasks API landmarks to a simple list of LandmarkPoints."""
    return [
        LandmarkPoint(x=lm.x, y=lm.y, z=lm.z)
        for lm in hand_landmarks
    ]


# ─── Preview Window ─────────────────────────────────────────────────────────


class PreviewWindow:
    """OpenCV preview window with hand landmark overlay and gesture display."""

    WINDOW_NAME = "Hand Cursor"

    # MediaPipe hand connections (21 landmarks)
    HAND_CONNECTIONS = [
        (0, 1), (1, 2), (2, 3), (3, 4),       # thumb
        (0, 5), (5, 6), (6, 7), (7, 8),       # index
        (0, 9), (9, 10), (10, 11), (11, 12),  # middle
        (0, 13), (13, 14), (14, 15), (15, 16),# ring
        (0, 17), (17, 18), (18, 19), (19, 20),# pinky
        (5, 9), (9, 13), (13, 17),             # palm
    ]

    def __init__(self, config: dict):
        self.config = config["display"]
        self._fps_history: list[float] = []
        self._last_time = time.time()

    def draw(
        self,
        frame: np.ndarray,
        landmarks_list: list,
        gesture: GestureType,
        cursor_pos: Optional[tuple] = None,
        tracking_active: bool = True,
    ) -> np.ndarray:
        """Draw landmarks, gesture info, and FPS on the frame."""
        display = frame.copy()
        h, w = display.shape[:2]

        # Draw hand landmarks
        if self.config["show_landmarks"] and landmarks_list:
            for landmarks in landmarks_list:
                # Draw connections
                for start_idx, end_idx in self.HAND_CONNECTIONS:
                    x1 = int(landmarks[start_idx].x * w)
                    y1 = int(landmarks[start_idx].y * h)
                    x2 = int(landmarks[end_idx].x * w)
                    y2 = int(landmarks[end_idx].y * h)
                    cv2.line(display, (x1, y1), (x2, y2), (255, 255, 255), 1)

                # Draw landmark points
                for i, lm in enumerate(landmarks):
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    color = (0, 255, 0)
                    radius = 3
                    if i == LM.INDEX_TIP:
                        color = (0, 200, 255)
                        radius = 8
                    elif i == LM.THUMB_TIP:
                        color = (255, 100, 100)
                        radius = 6
                    cv2.circle(display, (cx, cy), radius, color, -1)

                # Highlight index finger tip with outer ring
                tip = landmarks[LM.INDEX_TIP]
                cx, cy = int(tip.x * w), int(tip.y * h)
                cv2.circle(display, (cx, cy), 10, (255, 255, 255), 2)

        # Gesture label
        if self.config["show_gestures"]:
            label, color = GESTURE_DISPLAY.get(
                gesture, ("", (200, 200, 200))
            )
            if label:
                cv2.putText(
                    display, label, (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2,
                )

            status = "ACTIVE" if tracking_active else "PAUSED"
            status_color = (0, 255, 0) if tracking_active else (0, 0, 255)
            cv2.putText(
                display, status, (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_color, 2,
            )

        # FPS counter
        now = time.time()
        dt = now - self._last_time
        self._last_time = now
        if dt > 0:
            self._fps_history.append(1.0 / dt)
            if len(self._fps_history) > 30:
                self._fps_history.pop(0)
        avg_fps = sum(self._fps_history) / max(len(self._fps_history), 1)
        cv2.putText(
            display, f"FPS: {avg_fps:.0f}",
            (display.shape[1] - 110, 30),
            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1,
        )

        # Cursor position
        if cursor_pos:
            cv2.putText(
                display, f"({int(cursor_pos[0])}, {int(cursor_pos[1])})",
                (10, display.shape[0] - 15),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (180, 180, 180), 1,
            )

        return display

    def show(self, frame: np.ndarray):
        """Display the frame in the preview window."""
        pw = self.config["preview_width"]
        h, w = frame.shape[:2]
        ph = int(pw * h / w)
        resized = cv2.resize(frame, (pw, ph))
        cv2.imshow(self.WINDOW_NAME, resized)

    def close(self):
        """Close the preview window."""
        cv2.destroyWindow(self.WINDOW_NAME)


# ─── Main Application ───────────────────────────────────────────────────────


class HandCursor:
    """Main application: webcam → MediaPipe → gestures → cursor control."""

    def __init__(self, config: dict):
        self.config = config
        self.tracking_active = True
        self._prev_gesture = GestureType.NONE
        self._click_cooldown = 0.0

        # Initialize components
        gesture_cfg = config["gestures"]
        self.gesture_detector = GestureDetector(
            pinch_threshold=gesture_cfg["pinch_threshold"],
            right_click_threshold=gesture_cfg["right_click_threshold"],
            scroll_threshold=gesture_cfg["scroll_threshold"],
            pinch_frames=gesture_cfg["pinch_frames"],
            release_frames=gesture_cfg["release_frames"],
        )

        smooth_cfg = config["smoothing"]
        cursor_cfg = config["cursor"]
        self.smoother = CursorSmoother(
            min_cutoff=smooth_cfg["min_cutoff"],
            beta=smooth_cfg["beta"],
            d_cutoff=smooth_cfg["d_cutoff"],
            dead_zone=cursor_cfg["dead_zone"],
        )

        sw, sh = get_screen_size()
        self.mapper = ScreenMapper(
            screen_width=sw,
            screen_height=sh,
            sensitivity=cursor_cfg["sensitivity"],
            padding=cursor_cfg["screen_padding"],
            flip_x=True,
        )

        self.preview = PreviewWindow(config) if config["display"]["show_preview"] else None
        self._cursor_pos = (sw / 2.0, sh / 2.0)

    def run(self):
        """Main loop: capture → detect → gesture → move cursor."""
        cam_cfg = self.config["camera"]
        track_cfg = self.config["tracking"]

        # Check model file
        if not MODEL_PATH.exists():
            log.error("Model file not found: %s", MODEL_PATH)
            log.error("Download with: curl -sL -o hand_landmarker.task "
                       "https://storage.googleapis.com/mediapipe-models/"
                       "hand_landmarker/hand_landmarker/float16/latest/"
                       "hand_landmarker.task")
            sys.exit(1)

        # Open webcam
        cap = cv2.VideoCapture(cam_cfg["device"])
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, cam_cfg["width"])
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, cam_cfg["height"])
        cap.set(cv2.CAP_PROP_FPS, cam_cfg["fps"])

        if not cap.isOpened():
            log.error("Cannot open webcam (device %d)", cam_cfg["device"])
            sys.exit(1)

        actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        actual_fps = int(cap.get(cv2.CAP_PROP_FPS))
        log.info("Webcam opened: %dx%d @ %d fps", actual_w, actual_h, actual_fps)

        # Initialize MediaPipe HandLandmarker (Tasks API)
        base_options = mp_python.BaseOptions(
            model_asset_path=str(MODEL_PATH)
        )
        options = vision.HandLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.VIDEO,
            num_hands=track_cfg["max_hands"],
            min_hand_detection_confidence=track_cfg["detection_confidence"],
            min_tracking_confidence=track_cfg["tracking_confidence"],
        )
        landmarker = vision.HandLandmarker.create_from_options(options)

        sw, sh = get_screen_size()
        print()
        print("  ╔══════════════════════════════════════════╗")
        print("  ║       HAND CURSOR — Gesture Control      ║")
        print(f"  ║  v{VERSION}                                  ║")
        print("  ╠══════════════════════════════════════════╣")
        print(f"  ║  Screen  : {sw}x{sh:<26}║")
        print(f"  ║  Camera  : {actual_w}x{actual_h} @ {actual_fps}fps{' ' * 16}║")
        print("  ╠══════════════════════════════════════════╣")
        print("  ║  Index finger → move cursor              ║")
        print("  ║  Thumb+Index  → left click               ║")
        print("  ║  Thumb+Middle → right click              ║")
        print("  ║  Thumb+Ring   → scroll (move up/down)    ║")
        print("  ║  Fist         → pause tracking           ║")
        print("  ║  Press 'q' or Ctrl+C to quit             ║")
        print("  ╚══════════════════════════════════════════╝")
        print()

        frame_timestamp_ms = 0

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    log.warning("Failed to read frame")
                    continue

                # Convert BGR → RGB for MediaPipe
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(
                    image_format=mp.ImageFormat.SRGB,
                    data=rgb_frame,
                )

                # Detect hand landmarks
                frame_timestamp_ms += int(1000 / max(actual_fps, 1))
                result = landmarker.detect_for_video(mp_image, frame_timestamp_ms)

                gesture = GestureType.NONE
                cursor_pos = None
                wrapped_landmarks_list = []

                if result.hand_landmarks:
                    # Wrap landmarks for our gesture module
                    raw_landmarks = result.hand_landmarks[0]
                    landmarks = wrap_landmarks(raw_landmarks)
                    wrapped_landmarks_list = [landmarks]

                    # Detect gesture
                    gesture = self.gesture_detector.detect(landmarks)

                    # Handle fist = pause
                    if gesture == GestureType.FIST:
                        if self.tracking_active:
                            self.tracking_active = False
                            self.smoother.reset()
                            log.info("Tracking PAUSED (fist detected)")
                    elif gesture in (GestureType.OPEN_PALM, GestureType.NONE):
                        if not self.tracking_active:
                            self.tracking_active = True
                            self.smoother.reset()
                            log.info("Tracking RESUMED")

                    # Move cursor (when tracking is active)
                    if self.tracking_active and gesture != GestureType.FIST:
                        hand_x, hand_y = self.gesture_detector.get_pointer_position(landmarks)
                        raw_x, raw_y = self.mapper.map(hand_x, hand_y)
                        smooth_x, smooth_y = self.smoother.update(raw_x, raw_y)
                        self._cursor_pos = (smooth_x, smooth_y)

                        move_cursor(smooth_x, smooth_y)
                        cursor_pos = (smooth_x, smooth_y)

                    # Handle click/scroll gestures (edge-triggered)
                    self._handle_gesture_actions(gesture, landmarks)
                else:
                    cursor_pos = self._cursor_pos

                # Preview window
                if self.preview:
                    display = self.preview.draw(
                        frame, wrapped_landmarks_list, gesture,
                        cursor_pos, self.tracking_active,
                    )
                    self.preview.show(display)

                    key = cv2.waitKey(1) & 0xFF
                    if key == ord("q"):
                        break
                    elif key == ord("r"):
                        self.smoother.reset()
                        self.mapper.reset()
                        log.info("Reset smoother and mapper")

        except KeyboardInterrupt:
            pass
        finally:
            cap.release()
            landmarker.close()
            if self.preview:
                self.preview.close()
            log.info("Hand Cursor stopped.")
            print("\nHand Cursor stopped. Goodbye!")

    def _handle_gesture_actions(self, gesture: GestureType, landmarks):
        """Handle click and scroll based on gesture transitions."""
        now = time.time()

        if now < self._click_cooldown:
            self._prev_gesture = gesture
            return

        # Left click: PINCH just activated
        if gesture == GestureType.PINCH and self._prev_gesture != GestureType.PINCH:
            click_mouse(self._cursor_pos[0], self._cursor_pos[1], "left")
            self._click_cooldown = now + 0.3
            log.debug("Left click at (%.0f, %.0f)", *self._cursor_pos)

        # Right click: RIGHT_CLICK just activated
        elif gesture == GestureType.RIGHT_CLICK and self._prev_gesture != GestureType.RIGHT_CLICK:
            click_mouse(self._cursor_pos[0], self._cursor_pos[1], "right")
            self._click_cooldown = now + 0.3
            log.debug("Right click at (%.0f, %.0f)", *self._cursor_pos)

        # Scroll: continuous while in SCROLL mode
        elif gesture == GestureType.SCROLL:
            delta = self.gesture_detector.get_scroll_delta(landmarks)
            if abs(delta) > 0.1:
                scroll_mouse(delta)

        self._prev_gesture = gesture


# ─── Entry Point ─────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg in ("--version", "-v"):
            print(f"Hand Cursor v{VERSION}")
            sys.exit(0)
        elif arg in ("--help", "-h"):
            print(f"Hand Cursor v{VERSION} — Gesture-based cursor control")
            print()
            print("Usage: python hand_cursor.py [options]")
            print()
            print("Options:")
            print("  --version, -v     Show version")
            print("  --help, -h        Show this help")
            print("  --preview         Preview only (no cursor control)")
            print("  --no-preview      Run without preview window")
            print()
            print(f"Config: {CONFIG_PATH}")
            sys.exit(0)
        elif arg == "--preview":
            os.environ["HAND_CURSOR_PREVIEW_ONLY"] = "1"
        elif arg == "--no-preview":
            os.environ["HAND_CURSOR_NO_PREVIEW"] = "1"

    config = load_config()

    if os.environ.get("HAND_CURSOR_PREVIEW_ONLY"):
        global HAS_QUARTZ
        HAS_QUARTZ = False
        log.info("Preview-only mode — cursor control disabled")

    if os.environ.get("HAND_CURSOR_NO_PREVIEW"):
        config["display"]["show_preview"] = False

    app = HandCursor(config)
    app.run()


if __name__ == "__main__":
    main()
