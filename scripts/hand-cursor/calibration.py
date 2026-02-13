"""
Hand position to screen coordinate mapping — TRACKPAD MODE v3.

Key features:
  - Relative movement (trackpad-style, not absolute mapping)
  - Adaptive pointer acceleration curve (slow=precise, fast=coarse)
  - Hand loss recovery (smooth re-anchor when hand returns)
  - Screen edge clamping
"""

from __future__ import annotations

import math
import subprocess
import time
from typing import Tuple, Optional


def get_screen_size() -> Tuple[int, int]:
    """Get the main display resolution on macOS."""
    try:
        from Quartz import CGDisplayBounds, CGMainDisplayID
        bounds = CGDisplayBounds(CGMainDisplayID())
        return (int(bounds.size.width), int(bounds.size.height))
    except ImportError:
        try:
            result = subprocess.run(
                ["system_profiler", "SPDisplaysDataType"],
                capture_output=True, text=True, timeout=5,
            )
            for line in result.stdout.splitlines():
                if "Resolution" in line:
                    parts = line.split()
                    for i, p in enumerate(parts):
                        if p == "x" and i > 0 and i < len(parts) - 1:
                            return (int(parts[i - 1]), int(parts[i + 1]))
        except Exception:
            pass
        return (1920, 1080)


def get_current_cursor_pos() -> Tuple[float, float]:
    """Get current macOS cursor position."""
    try:
        from Quartz import CGEventCreate, CGEventGetLocation
        event = CGEventCreate(None)
        pos = CGEventGetLocation(event)
        return (pos.x, pos.y)
    except ImportError:
        return (960.0, 540.0)


class TrackpadMapper:
    """
    Maps hand movement to cursor movement with adaptive acceleration.

    Acceleration curve:
      - Very slow hand movement → 1:1 mapping (precise)
      - Medium speed → 2-3x amplification (normal)
      - Fast movement → 4-6x amplification (crossing screen quickly)

    This mimics how macOS trackpad acceleration works.
    """

    def __init__(
        self,
        screen_width: Optional[int] = None,
        screen_height: Optional[int] = None,
        sensitivity: float = 3.0,
        acceleration: float = 1.3,
        flip_x: bool = True,
    ):
        if screen_width is None or screen_height is None:
            screen_width, screen_height = get_screen_size()

        self.screen_width = screen_width
        self.screen_height = screen_height
        self.sensitivity = sensitivity
        self.acceleration = acceleration
        self.flip_x = flip_x

        self._prev_hand: Optional[Tuple[float, float]] = None
        self._cursor_x: float = 0.0
        self._cursor_y: float = 0.0
        self._initialized = False
        self._frames_since_reset = 0

    def reset(self):
        """Reset — next detection starts fresh."""
        self._prev_hand = None
        self._frames_since_reset = 0

    def initialize_cursor(self):
        """Sync cursor position with macOS."""
        cx, cy = get_current_cursor_pos()
        self._cursor_x = cx
        self._cursor_y = cy
        self._initialized = True

    def _acceleration_curve(self, speed: float) -> float:
        """
        Compute acceleration factor from hand speed.

        speed is normalized (0-1 range per frame delta).

        Returns multiplier:
          - speed < 0.002 → 0.8x (decelerate for precision)
          - speed ~ 0.01  → 1.5x (normal)
          - speed ~ 0.03  → 3.0x (fast)
          - speed > 0.05  → 5.0x (very fast, cap)
        """
        if speed < 0.001:
            return 0.5   # almost still → strong deceleration
        elif speed < 0.003:
            return 0.8   # very slow → slight deceleration (precision mode)
        elif speed < 0.008:
            return 1.2   # slow → slight acceleration
        elif speed < 0.015:
            return 2.0   # medium → moderate acceleration
        elif speed < 0.03:
            return 3.0   # fast → strong acceleration
        elif speed < 0.06:
            return 4.5   # very fast → cross-screen
        else:
            return 6.0   # extremely fast → cap

    def map(self, hand_x: float, hand_y: float) -> Tuple[float, float]:
        """Map hand delta to cursor position with adaptive acceleration."""
        if not self._initialized:
            self.initialize_cursor()

        if self.flip_x:
            hand_x = 1.0 - hand_x

        if self._prev_hand is None:
            self._prev_hand = (hand_x, hand_y)
            self._frames_since_reset = 0
            return (self._cursor_x, self._cursor_y)

        self._frames_since_reset += 1

        # Skip first 2 frames after reset (anchor stabilization)
        if self._frames_since_reset <= 2:
            self._prev_hand = (hand_x, hand_y)
            return (self._cursor_x, self._cursor_y)

        # Delta
        dx = hand_x - self._prev_hand[0]
        dy = hand_y - self._prev_hand[1]
        self._prev_hand = (hand_x, hand_y)

        # Speed (Euclidean)
        speed = math.sqrt(dx * dx + dy * dy)

        # Adaptive acceleration
        accel = self._acceleration_curve(speed)

        # Apply sensitivity + acceleration
        pixel_dx = dx * self.screen_width * self.sensitivity * accel
        pixel_dy = dy * self.screen_height * self.sensitivity * accel

        # Update position
        self._cursor_x += pixel_dx
        self._cursor_y += pixel_dy

        # Clamp
        self._cursor_x = max(0.0, min(float(self.screen_width - 1), self._cursor_x))
        self._cursor_y = max(0.0, min(float(self.screen_height - 1), self._cursor_y))

        return (self._cursor_x, self._cursor_y)
