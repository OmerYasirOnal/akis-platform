"""
Hand position to screen coordinate mapping and calibration.

Maps normalized MediaPipe hand coordinates (0-1) to screen pixel
coordinates, with support for:
  - Linear mapping with sensitivity amplification
  - Screen edge padding (dead zones at edges)
  - Movement amplification from a center anchor point
"""

from __future__ import annotations

import subprocess
from typing import Tuple, Optional


def get_screen_size() -> Tuple[int, int]:
    """
    Get the main display resolution on macOS.

    Returns
    -------
    tuple of (int, int)
        (width, height) in pixels.
    """
    try:
        from Quartz import CGDisplayBounds, CGMainDisplayID
        bounds = CGDisplayBounds(CGMainDisplayID())
        return (int(bounds.size.width), int(bounds.size.height))
    except ImportError:
        # Fallback: use system_profiler
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
                            w = int(parts[i - 1])
                            h = int(parts[i + 1])
                            return (w, h)
        except Exception:
            pass
        # Default fallback
        return (1920, 1080)


class ScreenMapper:
    """
    Maps normalized hand coordinates to screen pixel coordinates.

    The mapping uses a "virtual trackpad" model:
    - The hand's position within the camera frame maps to the full screen
    - Screen padding creates dead zones at the edges
    - Sensitivity amplifies small movements

    Parameters
    ----------
    screen_width : int
        Screen width in pixels.
    screen_height : int
        Screen height in pixels.
    sensitivity : float
        Movement amplification factor (1.0 = 1:1 mapping).
    padding : float
        Fraction of screen to use as edge dead zone (0.1 = 10%).
    flip_x : bool
        Mirror the X axis (True for selfie-mode webcam).
    """

    def __init__(
        self,
        screen_width: Optional[int] = None,
        screen_height: Optional[int] = None,
        sensitivity: float = 1.8,
        padding: float = 0.10,
        flip_x: bool = True,
    ):
        if screen_width is None or screen_height is None:
            screen_width, screen_height = get_screen_size()

        self.screen_width = screen_width
        self.screen_height = screen_height
        self.sensitivity = sensitivity
        self.padding = padding
        self.flip_x = flip_x

        # Anchor point for relative movement (center of hand range)
        self._anchor: Optional[Tuple[float, float]] = None
        self._screen_anchor: Optional[Tuple[float, float]] = None

    def reset(self):
        """Reset the anchor point."""
        self._anchor = None
        self._screen_anchor = None

    def map(self, hand_x: float, hand_y: float) -> Tuple[float, float]:
        """
        Map normalized hand position to screen coordinates.

        Parameters
        ----------
        hand_x : float
            Normalized hand X position (0-1, left to right in camera frame).
        hand_y : float
            Normalized hand Y position (0-1, top to bottom in camera frame).

        Returns
        -------
        tuple of (float, float)
            Screen coordinates (x, y) in pixels.
        """
        # Mirror X for selfie-mode
        if self.flip_x:
            hand_x = 1.0 - hand_x

        # Apply padding: map hand range [padding, 1-padding] to screen [0, size]
        pad = self.padding
        effective_range = 1.0 - 2.0 * pad

        # Normalize to [0, 1] within the effective range
        norm_x = (hand_x - pad) / effective_range
        norm_y = (hand_y - pad) / effective_range

        # Clamp to [0, 1]
        norm_x = max(0.0, min(1.0, norm_x))
        norm_y = max(0.0, min(1.0, norm_y))

        # Apply sensitivity amplification from center
        center_x, center_y = 0.5, 0.5
        diff_x = (norm_x - center_x) * self.sensitivity
        diff_y = (norm_y - center_y) * self.sensitivity

        # Clamp amplified values
        final_x = max(0.0, min(1.0, center_x + diff_x))
        final_y = max(0.0, min(1.0, center_y + diff_y))

        # Map to screen pixels
        screen_x = final_x * self.screen_width
        screen_y = final_y * self.screen_height

        # Clamp to screen bounds
        screen_x = max(0.0, min(float(self.screen_width - 1), screen_x))
        screen_y = max(0.0, min(float(self.screen_height - 1), screen_y))

        return (screen_x, screen_y)
