"""
Cursor smoothing filters for hand tracking.

Implements the One Euro Filter — an adaptive low-pass filter that balances
jitter reduction at low speeds with minimal lag at high speeds.

Reference: Casiez et al., "1€ Filter: A Simple Speed-based Low-pass Filter
for Noisy Input in Interactive Systems", CHI 2012.
"""

from __future__ import annotations

import math
import time
from typing import Optional, Tuple


class OneEuroFilter:
    """
    One Euro Filter for a single dimension.

    Parameters
    ----------
    min_cutoff : float
        Minimum cutoff frequency (Hz). Lower = smoother but more lag.
    beta : float
        Speed coefficient. Higher = less lag at fast movements.
    d_cutoff : float
        Cutoff frequency for the derivative filter.
    """

    def __init__(
        self,
        min_cutoff: float = 1.5,
        beta: float = 0.5,
        d_cutoff: float = 1.0,
    ):
        self.min_cutoff = min_cutoff
        self.beta = beta
        self.d_cutoff = d_cutoff

        self._x_prev: Optional[float] = None
        self._dx_prev: float = 0.0
        self._t_prev: Optional[float] = None

    def reset(self):
        """Reset the filter state."""
        self._x_prev = None
        self._dx_prev = 0.0
        self._t_prev = None

    @staticmethod
    def _smoothing_factor(t_e: float, cutoff: float) -> float:
        """Compute the exponential smoothing factor alpha."""
        r = 2.0 * math.pi * cutoff * t_e
        return r / (r + 1.0)

    @staticmethod
    def _exponential_smoothing(alpha: float, x: float, x_prev: float) -> float:
        """Apply exponential smoothing."""
        return alpha * x + (1.0 - alpha) * x_prev

    def __call__(self, x: float, t: Optional[float] = None) -> float:
        """
        Filter a new value.

        Parameters
        ----------
        x : float
            New raw value.
        t : float, optional
            Timestamp in seconds. If None, uses time.time().

        Returns
        -------
        float
            Filtered value.
        """
        if t is None:
            t = time.time()

        if self._t_prev is None:
            # First sample — initialize and return as-is
            self._x_prev = x
            self._dx_prev = 0.0
            self._t_prev = t
            return x

        # Time delta
        t_e = t - self._t_prev
        if t_e <= 0:
            t_e = 1e-6  # avoid division by zero

        # Filter the derivative (speed estimate)
        a_d = self._smoothing_factor(t_e, self.d_cutoff)
        dx = (x - self._x_prev) / t_e
        dx_hat = self._exponential_smoothing(a_d, dx, self._dx_prev)

        # Adaptive cutoff based on speed
        cutoff = self.min_cutoff + self.beta * abs(dx_hat)

        # Filter the signal
        a = self._smoothing_factor(t_e, cutoff)
        x_hat = self._exponential_smoothing(a, x, self._x_prev)

        # Store state
        self._x_prev = x_hat
        self._dx_prev = dx_hat
        self._t_prev = t

        return x_hat


class CursorSmoother:
    """
    2D cursor smoother using paired One Euro Filters + dead zone.

    Parameters
    ----------
    min_cutoff : float
        One Euro Filter min cutoff frequency.
    beta : float
        One Euro Filter speed coefficient.
    d_cutoff : float
        One Euro Filter derivative cutoff.
    dead_zone : float
        Minimum pixel movement to register (smaller movements are ignored).
    """

    def __init__(
        self,
        min_cutoff: float = 1.5,
        beta: float = 0.5,
        d_cutoff: float = 1.0,
        dead_zone: float = 3.0,
    ):
        self._filter_x = OneEuroFilter(min_cutoff, beta, d_cutoff)
        self._filter_y = OneEuroFilter(min_cutoff, beta, d_cutoff)
        self.dead_zone = dead_zone
        self._last_output: Optional[Tuple[float, float]] = None

    def reset(self):
        """Reset both axis filters and output state."""
        self._filter_x.reset()
        self._filter_y.reset()
        self._last_output = None

    def update(
        self, x: float, y: float, t: Optional[float] = None
    ) -> Tuple[float, float]:
        """
        Smooth a new cursor position.

        Parameters
        ----------
        x, y : float
            Raw cursor position in pixels.
        t : float, optional
            Timestamp in seconds.

        Returns
        -------
        tuple of (float, float)
            Smoothed cursor position.
        """
        sx = self._filter_x(x, t)
        sy = self._filter_y(y, t)

        # Apply dead zone
        if self._last_output is not None:
            dx = sx - self._last_output[0]
            dy = sy - self._last_output[1]
            dist = math.sqrt(dx * dx + dy * dy)
            if dist < self.dead_zone:
                return self._last_output

        self._last_output = (sx, sy)
        return (sx, sy)
