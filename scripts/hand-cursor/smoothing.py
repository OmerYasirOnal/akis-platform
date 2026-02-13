"""
Cursor smoothing filters for hand tracking — v3 (production anti-jitter).

Multi-stage pipeline:
  1. One Euro Filter (adaptive low-pass) — removes high-frequency jitter
  2. Dead zone gate — ignores micro-movements (hand tremor)
  3. Velocity-dependent interpolation — extra smooth when barely moving
"""

from __future__ import annotations

import math
import time
from typing import Optional, Tuple


class OneEuroFilter:
    """
    One Euro Filter — adaptive low-pass filter.

    v3 tuning: even more aggressive at low speeds, fast response at high speeds.
    """

    def __init__(
        self,
        min_cutoff: float = 0.3,   # Lower = smoother when still
        beta: float = 0.8,          # Higher = faster response when moving
        d_cutoff: float = 1.0,
    ):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff

        self._x_prev: Optional[float] = None
        self._dx_prev: float = 0.0
        self._t_prev: Optional[float] = None

    def reset(self):
        self._x_prev = None
        self._dx_prev = 0.0
        self._t_prev = None

    @staticmethod
    def _alpha(t_e: float, cutoff: float) -> float:
        r = 2.0 * math.pi * cutoff * t_e
        return r / (r + 1.0)

    def __call__(self, x: float, t: Optional[float] = None) -> float:
        if t is None:
            t = time.time()

        if self._t_prev is None:
            self._x_prev = x
            self._dx_prev = 0.0
            self._t_prev = t
            return x

        t_e = max(t - self._t_prev, 1e-6)

        # Filter derivative
        a_d = self._alpha(t_e, self.d_cutoff)
        dx = (x - self._x_prev) / t_e
        dx_hat = a_d * dx + (1.0 - a_d) * self._dx_prev

        # Adaptive cutoff
        cutoff = self.min_cutoff + self.beta * abs(dx_hat)

        # Filter signal
        a = self._alpha(t_e, cutoff)
        x_hat = a * x + (1.0 - a) * self._x_prev

        self._x_prev = x_hat
        self._dx_prev = dx_hat
        self._t_prev = t

        return x_hat


class CursorSmoother:
    """
    2D cursor smoother v3:
      - One Euro Filter (per axis)
      - Dead zone (ignore tremor)
      - Velocity interpolation (blend towards target when moving slowly)
    """

    def __init__(
        self,
        min_cutoff: float = 0.3,
        beta: float = 0.8,
        d_cutoff: float = 1.0,
        dead_zone: float = 4.0,
        velocity_lerp_threshold: float = 15.0,
    ):
        self._filter_x = OneEuroFilter(min_cutoff, beta, d_cutoff)
        self._filter_y = OneEuroFilter(min_cutoff, beta, d_cutoff)
        self.dead_zone = dead_zone
        self.velocity_lerp_threshold = velocity_lerp_threshold
        self._last_output: Optional[Tuple[float, float]] = None
        self._last_time: Optional[float] = None

    def reset(self):
        self._filter_x.reset()
        self._filter_y.reset()
        self._last_output = None
        self._last_time = None

    def update(
        self, x: float, y: float, t: Optional[float] = None
    ) -> Tuple[float, float]:
        if t is None:
            t = time.time()

        sx = self._filter_x(x, t)
        sy = self._filter_y(y, t)

        if self._last_output is None:
            self._last_output = (sx, sy)
            self._last_time = t
            return (sx, sy)

        dx = sx - self._last_output[0]
        dy = sy - self._last_output[1]
        dist = math.sqrt(dx * dx + dy * dy)

        # Dead zone: completely ignore tremor-level movements
        if dist < self.dead_zone:
            return self._last_output

        # Velocity interpolation: blend more when moving slowly
        if dist < self.velocity_lerp_threshold:
            blend = dist / self.velocity_lerp_threshold
            blend = blend * blend  # quadratic easing
            sx = self._last_output[0] + dx * blend
            sy = self._last_output[1] + dy * blend

        self._last_output = (sx, sy)
        self._last_time = t
        return (sx, sy)
