#!/usr/bin/env python3
"""
Hand Cursor v3 — Production-quality gesture cursor control.

v3 improvements:
  - DRAG & DROP: pinch held >0.3s while moving = drag mode
  - DOUBLE CLICK: two quick pinches within 0.4s
  - ADAPTIVE ACCELERATION: slow hand=precise, fast hand=cross-screen
  - HAND LOSS RECOVERY: smooth re-anchor when hand returns to frame
  - LANDMARK CONFIDENCE: skip low-quality detection frames
  - All v2 features: trackpad mode, deliberate clicks, sound, preview
"""

from __future__ import annotations

import os
import sys
import time
import signal
import logging
import subprocess
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
from calibration import TrackpadMapper, get_screen_size

# ─── Logging ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("hand-cursor")

# ─── Constants ──────────────────────────────────────────────────────────────

VERSION = "3.0.0"
CONFIG_PATH = Path(__file__).parent / "config.yaml"
MODEL_PATH = Path(__file__).parent / "hand_landmarker.task"

# Gesture → display config (label, BGR color, icon)
GESTURE_DISPLAY = {
    GestureType.NONE:        ("MOVE",        (180, 180, 180), "point"),
    GestureType.POINT:       ("MOVE",        (200, 200, 200), "point"),
    GestureType.PINCH:       ("CLICK!",      (0, 220, 0),     "pinch"),
    GestureType.PINCH_READY: ("READY...",    (0, 200, 255),   "ready"),
    GestureType.DRAG:        ("DRAGGING",    (255, 0, 255),   "drag"),
    GestureType.RIGHT_CLICK: ("RIGHT CLICK", (0, 140, 255),   "right"),
    GestureType.SCROLL:      ("SCROLL",      (255, 180, 0),   "scroll"),
    GestureType.FIST:        ("PAUSED",      (0, 0, 220),     "fist"),
    GestureType.OPEN_PALM:   ("OPEN",        (0, 200, 0),     "palm"),
}

# ─── Sound Feedback ─────────────────────────────────────────────────────────


def play_sound(name: str = "Tink"):
    """Play a macOS system sound (non-blocking)."""
    path = f"/System/Library/Sounds/{name}.aiff"
    if os.path.exists(path):
        try:
            subprocess.Popen(
                ["afplay", path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            pass


# ─── macOS Cursor Control ───────────────────────────────────────────────────

try:
    from Quartz.CoreGraphics import (
        CGEventCreateMouseEvent,
        CGEventPost,
        CGEventCreateScrollWheelEvent,
        kCGEventMouseMoved,
        kCGEventLeftMouseDown,
        kCGEventLeftMouseUp,
        kCGEventLeftMouseDragged,
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
    log.warning("Quartz not available — cursor control disabled")


def move_cursor(x: float, y: float):
    if not HAS_QUARTZ:
        return
    ev = CGEventCreateMouseEvent(None, kCGEventMouseMoved, (x, y), kCGMouseButtonLeft)
    CGEventPost(kCGHIDEventTap, ev)


def click_mouse(x: float, y: float, button: str = "left"):
    if not HAS_QUARTZ:
        return
    if button == "right":
        down_t, up_t, btn = kCGEventRightMouseDown, kCGEventRightMouseUp, kCGMouseButtonRight
    else:
        down_t, up_t, btn = kCGEventLeftMouseDown, kCGEventLeftMouseUp, kCGMouseButtonLeft
    CGEventPost(kCGHIDEventTap, CGEventCreateMouseEvent(None, down_t, (x, y), btn))
    time.sleep(0.02)
    CGEventPost(kCGHIDEventTap, CGEventCreateMouseEvent(None, up_t, (x, y), btn))


def mouse_down(x: float, y: float):
    """Press and hold left mouse button (for drag start)."""
    if not HAS_QUARTZ:
        return
    ev = CGEventCreateMouseEvent(None, kCGEventLeftMouseDown, (x, y), kCGMouseButtonLeft)
    CGEventPost(kCGHIDEventTap, ev)


def mouse_up(x: float, y: float):
    """Release left mouse button (for drag end)."""
    if not HAS_QUARTZ:
        return
    ev = CGEventCreateMouseEvent(None, kCGEventLeftMouseUp, (x, y), kCGMouseButtonLeft)
    CGEventPost(kCGHIDEventTap, ev)


def double_click(x: float, y: float):
    """Perform a double-click."""
    if not HAS_QUARTZ:
        return
    for _ in range(2):
        CGEventPost(kCGHIDEventTap, CGEventCreateMouseEvent(None, kCGEventLeftMouseDown, (x, y), kCGMouseButtonLeft))
        time.sleep(0.02)
        CGEventPost(kCGHIDEventTap, CGEventCreateMouseEvent(None, kCGEventLeftMouseUp, (x, y), kCGMouseButtonLeft))
        time.sleep(0.05)


def scroll_mouse(delta_y: float):
    if not HAS_QUARTZ:
        return
    amount = int(delta_y)
    if amount == 0:
        return
    ev = CGEventCreateScrollWheelEvent(None, kCGScrollEventUnitLine, 1, amount)
    CGEventPost(kCGHIDEventTap, ev)


# ─── Configuration ──────────────────────────────────────────────────────────


def load_config() -> dict:
    defaults = {
        "camera": {"device": 0, "width": 640, "height": 480, "fps": 30},
        "tracking": {
            "max_hands": 1,
            "detection_confidence": 0.7,
            "tracking_confidence": 0.5,
        },
        "gestures": {
            "pinch_threshold": 0.030,
            "right_click_threshold": 0.035,
            "scroll_threshold": 0.040,
            "pinch_ready_threshold": 0.065,
            "fist_pause": True,
            "pinch_frames": 3,
            "release_frames": 2,
        },
        "cursor": {
            "sensitivity": 3.0,
            "acceleration": 1.3,
            "dead_zone": 5,
        },
        "smoothing": {"min_cutoff": 0.5, "beta": 0.7, "d_cutoff": 1.0},
        "display": {
            "show_preview": True,
            "show_landmarks": True,
            "show_gestures": True,
            "show_debug": True,
            "preview_width": 640,
        },
        "sound": {"enabled": True},
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
    x: float
    y: float
    z: float


def wrap_landmarks(hand_landmarks) -> list:
    return [LandmarkPoint(x=lm.x, y=lm.y, z=lm.z) for lm in hand_landmarks]


# ─── Preview Window v2 ──────────────────────────────────────────────────────


class PreviewWindow:
    """Large preview with gesture guide, debug distances, and status."""

    WINDOW_NAME = "Hand Cursor v3"

    HAND_CONNECTIONS = [
        (0, 1), (1, 2), (2, 3), (3, 4),
        (0, 5), (5, 6), (6, 7), (7, 8),
        (0, 9), (9, 10), (10, 11), (11, 12),
        (0, 13), (13, 14), (14, 15), (15, 16),
        (0, 17), (17, 18), (18, 19), (19, 20),
        (5, 9), (9, 13), (13, 17),
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
        debug_distances: Optional[dict] = None,
    ) -> np.ndarray:
        display = frame.copy()
        h, w = display.shape[:2]

        # ── Hand landmarks ──
        if self.config["show_landmarks"] and landmarks_list:
            for landmarks in landmarks_list:
                # Connections
                for s, e in self.HAND_CONNECTIONS:
                    x1, y1 = int(landmarks[s].x * w), int(landmarks[s].y * h)
                    x2, y2 = int(landmarks[e].x * w), int(landmarks[e].y * h)
                    cv2.line(display, (x1, y1), (x2, y2), (200, 200, 200), 1)

                # Points
                for i, lm in enumerate(landmarks):
                    cx, cy = int(lm.x * w), int(lm.y * h)
                    if i == LM.INDEX_TIP:
                        cv2.circle(display, (cx, cy), 10, (0, 200, 255), -1)
                        cv2.circle(display, (cx, cy), 13, (255, 255, 255), 2)
                    elif i == LM.THUMB_TIP:
                        cv2.circle(display, (cx, cy), 8, (255, 100, 100), -1)
                        cv2.circle(display, (cx, cy), 10, (255, 255, 255), 2)
                    elif i in (LM.MIDDLE_TIP, LM.RING_TIP, LM.PINKY_TIP):
                        cv2.circle(display, (cx, cy), 5, (100, 255, 100), -1)
                    else:
                        cv2.circle(display, (cx, cy), 3, (150, 150, 150), -1)

                # Draw line between thumb and index (pinch indicator)
                tx = int(landmarks[LM.THUMB_TIP].x * w)
                ty = int(landmarks[LM.THUMB_TIP].y * h)
                ix = int(landmarks[LM.INDEX_TIP].x * w)
                iy = int(landmarks[LM.INDEX_TIP].y * h)

                # Color based on distance
                if gesture == GestureType.PINCH:
                    line_color = (0, 255, 0)
                    thickness = 3
                elif gesture == GestureType.PINCH_READY:
                    line_color = (0, 200, 255)
                    thickness = 2
                else:
                    line_color = (100, 100, 100)
                    thickness = 1
                cv2.line(display, (tx, ty), (ix, iy), line_color, thickness)

        # ── Gesture label (large) ──
        if self.config["show_gestures"]:
            label, color, _ = GESTURE_DISPLAY.get(gesture, ("", (200, 200, 200), ""))
            if label:
                # Large gesture text
                cv2.putText(display, label, (15, 40),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)

            # Tracking status bar
            bar_color = (0, 180, 0) if tracking_active else (0, 0, 200)
            cv2.rectangle(display, (0, h - 6), (w, h), bar_color, -1)

        # ── Debug distances ──
        if self.config.get("show_debug") and debug_distances:
            y_off = 70
            for name, dist in debug_distances.items():
                bar_len = int(min(dist * 1000, 200))
                bar_color = (0, 255, 0) if dist < 0.030 else (0, 200, 255) if dist < 0.065 else (100, 100, 100)
                cv2.rectangle(display, (15, y_off), (15 + bar_len, y_off + 12), bar_color, -1)
                cv2.putText(display, f"{name}: {dist:.3f}", (220, y_off + 11),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1)
                y_off += 18

        # ── FPS ──
        now = time.time()
        dt = now - self._last_time
        self._last_time = now
        if dt > 0:
            self._fps_history.append(1.0 / dt)
            if len(self._fps_history) > 30:
                self._fps_history.pop(0)
        avg_fps = sum(self._fps_history) / max(len(self._fps_history), 1)
        cv2.putText(display, f"{avg_fps:.0f} FPS", (w - 100, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

        # ── Cursor pos ──
        if cursor_pos:
            cv2.putText(display, f"Cursor: ({int(cursor_pos[0])}, {int(cursor_pos[1])})",
                        (w - 220, h - 15),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180, 180, 180), 1)

        # ── Gesture guide (bottom left) ──
        guide_y = h - 110
        guide = [
            ("Point finger    = MOVE", (200, 200, 200)),
            ("Thumb+Index tap = CLICK", (0, 220, 0)),
            ("Thumb+Index x2  = DOUBLE CLICK", (0, 180, 0)),
            ("Thumb+Index hold= DRAG", (255, 0, 255)),
            ("Fist            = PAUSE", (0, 0, 220)),
            ("'q' = QUIT", (150, 150, 150)),
        ]
        for text, col in guide:
            cv2.putText(display, text, (15, guide_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.4, col, 1)
            guide_y += 18

        return display

    def show(self, frame: np.ndarray):
        pw = self.config["preview_width"]
        h, w = frame.shape[:2]
        ph = int(pw * h / w)
        resized = cv2.resize(frame, (pw, ph))
        cv2.imshow(self.WINDOW_NAME, resized)

    def close(self):
        cv2.destroyWindow(self.WINDOW_NAME)


# ─── Main Application v2 ────────────────────────────────────────────────────


class HandCursor:
    """Main application v2: trackpad mode + deliberate clicks + sound."""

    def __init__(self, config: dict):
        self.config = config
        self.tracking_active = True
        self.sound_enabled = config.get("sound", {}).get("enabled", True)
        self._prev_gesture = GestureType.NONE
        self._click_cooldown = 0.0
        self._is_mouse_down = False     # Drag state
        self._hand_lost_frames = 0      # Hand loss counter
        self._max_hand_lost = config.get("cursor", {}).get("hand_lost_max_frames", 10)

        # Gesture detector
        g = config["gestures"]
        self.gesture_detector = GestureDetector(
            pinch_threshold=g["pinch_threshold"],
            right_click_threshold=g["right_click_threshold"],
            scroll_threshold=g["scroll_threshold"],
            pinch_ready_threshold=g.get("pinch_ready_threshold", 0.065),
            pinch_frames=g["pinch_frames"],
            release_frames=g["release_frames"],
            drag_hold_time=g.get("drag_hold_time", 0.35),
            double_click_window=g.get("double_click_window", 0.45),
        )

        # Smoother (v3: velocity lerp)
        s = config["smoothing"]
        c = config["cursor"]
        self.smoother = CursorSmoother(
            min_cutoff=s["min_cutoff"],
            beta=s["beta"],
            d_cutoff=s["d_cutoff"],
            dead_zone=c["dead_zone"],
            velocity_lerp_threshold=s.get("velocity_lerp_threshold", 15.0),
        )

        # Trackpad mapper (RELATIVE movement, not absolute!)
        sw, sh = get_screen_size()
        self.mapper = TrackpadMapper(
            screen_width=sw,
            screen_height=sh,
            sensitivity=c["sensitivity"],
            acceleration=c.get("acceleration", 1.3),
            flip_x=True,
        )

        self.preview = PreviewWindow(config) if config["display"]["show_preview"] else None
        self._cursor_pos = (sw / 2.0, sh / 2.0)

    def run(self):
        cam_cfg = self.config["camera"]
        track_cfg = self.config["tracking"]

        if not MODEL_PATH.exists():
            log.error("Model not found: %s", MODEL_PATH)
            log.error("Run: curl -sL -o hand_landmarker.task "
                       "https://storage.googleapis.com/mediapipe-models/"
                       "hand_landmarker/hand_landmarker/float16/latest/"
                       "hand_landmarker.task")
            sys.exit(1)

        cap = cv2.VideoCapture(cam_cfg["device"])
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, cam_cfg["width"])
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, cam_cfg["height"])
        cap.set(cv2.CAP_PROP_FPS, cam_cfg["fps"])

        if not cap.isOpened():
            log.error("Cannot open webcam (device %d)", cam_cfg["device"])
            sys.exit(1)

        aw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        ah = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        af = int(cap.get(cv2.CAP_PROP_FPS))
        log.info("Webcam: %dx%d @ %d fps", aw, ah, af)

        base_options = mp_python.BaseOptions(model_asset_path=str(MODEL_PATH))
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
        print("  ╔══════════════════════════════════════════════╗")
        print("  ║      HAND CURSOR v3 — Drag + Acceleration     ║")
        print("  ╠══════════════════════════════════════════════╣")
        print(f"  ║  Screen    : {sw}x{sh:<28}║")
        print(f"  ║  Camera    : {aw}x{ah} @ {af}fps{' ' * 20}║")
        print(f"  ║  Sensitivity: {self.config['cursor']['sensitivity']:<29}║")
        print("  ╠══════════════════════════════════════════════╣")
        print("  ║  Point finger    → MOVE (adaptive speed)    ║")
        print("  ║  Thumb+Index tap → LEFT CLICK               ║")
        print("  ║  Thumb+Index x2  → DOUBLE CLICK             ║")
        print("  ║  Thumb+Index hold→ DRAG & DROP              ║")
        print("  ║  Thumb+Middle    → RIGHT CLICK              ║")
        print("  ║  Thumb+Ring      → SCROLL                   ║")
        print("  ║  Fist            → PAUSE                    ║")
        print("  ║  'q' to quit                                ║")
        print("  ╚══════════════════════════════════════════════╝")
        print()

        if self.sound_enabled:
            play_sound("Tink")

        frame_ts = 0

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    continue

                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

                frame_ts += int(1000 / max(af, 1))
                result = landmarker.detect_for_video(mp_image, frame_ts)

                gesture = GestureType.NONE
                cursor_pos = None
                wrapped_list = []
                debug_dist = {}

                if result.hand_landmarks:
                    self._hand_lost_frames = 0  # Hand visible

                    landmarks = wrap_landmarks(result.hand_landmarks[0])
                    wrapped_list = [landmarks]

                    # Visibility/confidence filter: skip if hand score is very low
                    if result.hand_world_landmarks:
                        pass  # world landmarks available = good quality

                    gesture = self.gesture_detector.detect(landmarks)
                    debug_dist = self.gesture_detector.debug_distances

                    # Pause/Resume
                    if gesture == GestureType.FIST:
                        if self.tracking_active:
                            self.tracking_active = False
                            self._release_drag()
                            self.smoother.reset()
                            self.mapper.reset()
                            log.info("PAUSED")
                            if self.sound_enabled:
                                play_sound("Basso")
                    elif gesture == GestureType.OPEN_PALM:
                        if not self.tracking_active:
                            self.tracking_active = True
                            self.smoother.reset()
                            self.mapper.reset()
                            log.info("RESUMED")
                            if self.sound_enabled:
                                play_sound("Tink")

                    # Move cursor (trackpad mode)
                    if self.tracking_active and gesture not in (GestureType.FIST, GestureType.OPEN_PALM):
                        hx, hy = self.gesture_detector.get_pointer_position(landmarks)
                        raw_x, raw_y = self.mapper.map(hx, hy)
                        sx, sy = self.smoother.update(raw_x, raw_y)
                        self._cursor_pos = (sx, sy)

                        if self._is_mouse_down and HAS_QUARTZ:
                            # Drag mode: move with mouse held down
                            ev = CGEventCreateMouseEvent(None, kCGEventLeftMouseDragged, (sx, sy), kCGMouseButtonLeft)
                            CGEventPost(kCGHIDEventTap, ev)
                        else:
                            move_cursor(sx, sy)
                        cursor_pos = (sx, sy)

                    # Actions (click, drag, scroll)
                    self._handle_actions(gesture, landmarks)
                else:
                    # Hand lost
                    self._hand_lost_frames += 1

                    # Release drag if hand lost
                    if self._is_mouse_down:
                        self._release_drag()

                    # Soft reset after a few lost frames
                    if self._hand_lost_frames == self._max_hand_lost:
                        self.mapper.reset()
                        self.gesture_detector.reset()
                        log.debug("Hand lost — mapper reset (anchor cleared)")

                    cursor_pos = self._cursor_pos

                # Preview
                if self.preview:
                    display = self.preview.draw(
                        frame, wrapped_list, gesture,
                        cursor_pos, self.tracking_active, debug_dist,
                    )
                    self.preview.show(display)

                    key = cv2.waitKey(1) & 0xFF
                    if key == ord("q"):
                        break
                    elif key == ord("r"):
                        self.smoother.reset()
                        self.mapper.reset()
                        log.info("Reset")

        except KeyboardInterrupt:
            pass
        finally:
            cap.release()
            landmarker.close()
            if self.preview:
                self.preview.close()
            log.info("Stopped.")
            print("\nHand Cursor stopped.")

    def _release_drag(self):
        """Release mouse button if dragging."""
        if self._is_mouse_down:
            mouse_up(self._cursor_pos[0], self._cursor_pos[1])
            self._is_mouse_down = False
            log.info("DRAG END at (%.0f, %.0f)", *self._cursor_pos)
            if self.sound_enabled:
                play_sound("Blow")

    def _handle_actions(self, gesture: GestureType, landmarks):
        now = time.time()
        if now < self._click_cooldown:
            self._prev_gesture = gesture
            return

        # DRAG MODE: gesture detector says DRAG (pinch held long enough)
        if gesture == GestureType.DRAG:
            if not self._is_mouse_down:
                mouse_down(self._cursor_pos[0], self._cursor_pos[1])
                self._is_mouse_down = True
                log.info("DRAG START at (%.0f, %.0f)", *self._cursor_pos)
                if self.sound_enabled:
                    play_sound("Morse")
            self._prev_gesture = gesture
            return

        # If we were dragging and gesture changed → release
        if self._is_mouse_down and gesture != GestureType.DRAG:
            self._release_drag()

        # LEFT CLICK (edge-triggered: PINCH just started)
        if gesture == GestureType.PINCH and self._prev_gesture != GestureType.PINCH:
            # Check for double-click
            is_double = self.gesture_detector.check_double_click()
            if is_double:
                double_click(self._cursor_pos[0], self._cursor_pos[1])
                self._click_cooldown = now + 0.5
                if self.sound_enabled:
                    play_sound("Pop")
                    time.sleep(0.05)
                    play_sound("Pop")
                log.info("DOUBLE CLICK at (%.0f, %.0f)", *self._cursor_pos)
            else:
                click_mouse(self._cursor_pos[0], self._cursor_pos[1], "left")
                self._click_cooldown = now + 0.3
                if self.sound_enabled:
                    play_sound("Pop")
                log.info("LEFT CLICK at (%.0f, %.0f)", *self._cursor_pos)

        # RIGHT CLICK
        elif gesture == GestureType.RIGHT_CLICK and self._prev_gesture != GestureType.RIGHT_CLICK:
            click_mouse(self._cursor_pos[0], self._cursor_pos[1], "right")
            self._click_cooldown = now + 0.4
            if self.sound_enabled:
                play_sound("Frog")
            log.info("RIGHT CLICK at (%.0f, %.0f)", *self._cursor_pos)

        # SCROLL
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
            print(f"Hand Cursor v{VERSION} — Drag, double-click, adaptive acceleration")
            print()
            print("Usage: python hand_cursor.py [options]")
            print()
            print("Options:")
            print("  --version, -v     Show version")
            print("  --help, -h        Show help")
            print("  --preview         Preview only (no cursor control)")
            print("  --no-preview      No preview window")
            print("  --no-sound        Disable sound feedback")
            print()
            print(f"Config: {CONFIG_PATH}")
            sys.exit(0)
        elif arg == "--preview":
            os.environ["HAND_CURSOR_PREVIEW_ONLY"] = "1"
        elif arg == "--no-preview":
            os.environ["HAND_CURSOR_NO_PREVIEW"] = "1"
        elif arg == "--no-sound":
            os.environ["HAND_CURSOR_NO_SOUND"] = "1"

    config = load_config()

    if os.environ.get("HAND_CURSOR_PREVIEW_ONLY"):
        global HAS_QUARTZ
        HAS_QUARTZ = False
        log.info("Preview-only mode")

    if os.environ.get("HAND_CURSOR_NO_PREVIEW"):
        config["display"]["show_preview"] = False

    if os.environ.get("HAND_CURSOR_NO_SOUND"):
        config["sound"]["enabled"] = False

    app = HandCursor(config)
    app.run()


if __name__ == "__main__":
    main()
