"""
Hand gesture recognition from MediaPipe Hands landmarks.

Supported gestures:
  - Pinch (thumb + index) → left click
  - Right-click pinch (thumb + middle) → right click
  - Scroll pinch (thumb + ring) → scroll mode
  - Fist (all fingers closed) → pause tracking
  - Open palm → tracking active

Uses temporal stability: a gesture must be detected for N consecutive
frames before it is considered active, reducing false positives.
"""

from __future__ import annotations

import math
from enum import Enum, auto
from typing import List, Optional, Tuple


# ─── MediaPipe Hand Landmark IDs ────────────────────────────────────────────

class LM:
    """MediaPipe Hands landmark indices."""
    WRIST = 0
    THUMB_CMC = 1
    THUMB_MCP = 2
    THUMB_IP = 3
    THUMB_TIP = 4
    INDEX_MCP = 5
    INDEX_PIP = 6
    INDEX_DIP = 7
    INDEX_TIP = 8
    MIDDLE_MCP = 9
    MIDDLE_PIP = 10
    MIDDLE_DIP = 11
    MIDDLE_TIP = 12
    RING_MCP = 13
    RING_PIP = 14
    RING_DIP = 15
    RING_TIP = 16
    PINKY_MCP = 17
    PINKY_PIP = 18
    PINKY_DIP = 19
    PINKY_TIP = 20


# ─── Gesture Types ──────────────────────────────────────────────────────────

class GestureType(Enum):
    NONE = auto()
    PINCH = auto()          # thumb + index → left click
    RIGHT_CLICK = auto()    # thumb + middle → right click
    SCROLL = auto()         # thumb + ring → scroll mode
    FIST = auto()           # all fingers closed → pause
    OPEN_PALM = auto()      # all fingers open → active


# ─── Utility Functions ──────────────────────────────────────────────────────

def _distance(a, b) -> float:
    """Euclidean distance between two landmarks (using x, y)."""
    return math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)


def _distance_3d(a, b) -> float:
    """Euclidean distance between two landmarks (using x, y, z)."""
    return math.sqrt(
        (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2
    )


def _is_finger_closed(landmarks, tip_id: int, mcp_id: int) -> bool:
    """
    Check if a finger is closed (curled).
    A finger is closed when its tip is closer to the wrist than its MCP joint.
    """
    wrist = landmarks[LM.WRIST]
    tip = landmarks[tip_id]
    mcp = landmarks[mcp_id]
    return _distance(tip, wrist) < _distance(mcp, wrist)


# ─── Gesture Detector ───────────────────────────────────────────────────────

class GestureDetector:
    """
    Detects hand gestures from MediaPipe Hand landmarks with temporal stability.

    Parameters
    ----------
    pinch_threshold : float
        Normalized distance threshold for pinch detection.
    right_click_threshold : float
        Normalized distance threshold for right-click pinch.
    scroll_threshold : float
        Normalized distance threshold for scroll pinch.
    pinch_frames : int
        Number of consecutive frames to confirm a pinch.
    release_frames : int
        Number of consecutive frames to confirm a release.
    """

    def __init__(
        self,
        pinch_threshold: float = 0.045,
        right_click_threshold: float = 0.045,
        scroll_threshold: float = 0.045,
        pinch_frames: int = 2,
        release_frames: int = 2,
    ):
        self.pinch_threshold = pinch_threshold
        self.right_click_threshold = right_click_threshold
        self.scroll_threshold = scroll_threshold
        self.pinch_frames = pinch_frames
        self.release_frames = release_frames

        # State tracking
        self._active_gesture = GestureType.NONE
        self._candidate_gesture = GestureType.NONE
        self._candidate_count = 0
        self._release_count = 0

        # Scroll tracking
        self._scroll_anchor_y: Optional[float] = None

    @property
    def active_gesture(self) -> GestureType:
        """Currently active (confirmed) gesture."""
        return self._active_gesture

    def reset(self):
        """Reset all gesture state."""
        self._active_gesture = GestureType.NONE
        self._candidate_gesture = GestureType.NONE
        self._candidate_count = 0
        self._release_count = 0
        self._scroll_anchor_y = None

    def detect(self, landmarks) -> GestureType:
        """
        Detect gesture from MediaPipe hand landmarks.

        Parameters
        ----------
        landmarks : list
            MediaPipe hand landmarks (21 points).

        Returns
        -------
        GestureType
            The currently active gesture after temporal filtering.
        """
        raw_gesture = self._detect_raw(landmarks)
        return self._apply_temporal_filter(raw_gesture)

    def get_scroll_delta(self, landmarks) -> float:
        """
        Get scroll delta when in scroll mode.

        Returns
        -------
        float
            Vertical scroll amount (positive = up, negative = down).
            Returns 0 if not in scroll mode.
        """
        if self._active_gesture != GestureType.SCROLL:
            self._scroll_anchor_y = None
            return 0.0

        index_y = landmarks[LM.INDEX_TIP].y

        if self._scroll_anchor_y is None:
            self._scroll_anchor_y = index_y
            return 0.0

        delta = (self._scroll_anchor_y - index_y) * 20.0  # amplify
        self._scroll_anchor_y = index_y
        return delta

    def get_pointer_position(self, landmarks) -> Tuple[float, float]:
        """
        Get the pointer position from the index finger tip.

        Returns
        -------
        tuple of (float, float)
            Normalized (x, y) position of the index finger tip.
        """
        tip = landmarks[LM.INDEX_TIP]
        return (tip.x, tip.y)

    def _detect_raw(self, landmarks) -> GestureType:
        """Detect raw gesture without temporal filtering."""
        # Check fist first (all fingers closed = pause)
        if self._is_fist(landmarks):
            return GestureType.FIST

        # Check pinch gestures (priority: left click > right click > scroll)
        thumb = landmarks[LM.THUMB_TIP]
        index = landmarks[LM.INDEX_TIP]
        middle = landmarks[LM.MIDDLE_TIP]
        ring = landmarks[LM.RING_TIP]

        thumb_index_dist = _distance(thumb, index)
        thumb_middle_dist = _distance(thumb, middle)
        thumb_ring_dist = _distance(thumb, ring)

        if thumb_index_dist < self.pinch_threshold:
            return GestureType.PINCH

        if thumb_middle_dist < self.right_click_threshold:
            return GestureType.RIGHT_CLICK

        if thumb_ring_dist < self.scroll_threshold:
            return GestureType.SCROLL

        # Check open palm
        if self._is_open_palm(landmarks):
            return GestureType.OPEN_PALM

        return GestureType.NONE

    def _apply_temporal_filter(self, raw_gesture: GestureType) -> GestureType:
        """Apply temporal stability filtering to raw gesture detection."""
        if raw_gesture == self._active_gesture:
            # Same as active — reset release counter
            self._release_count = 0
            self._candidate_gesture = GestureType.NONE
            self._candidate_count = 0
            return self._active_gesture

        if raw_gesture == GestureType.NONE or raw_gesture == GestureType.OPEN_PALM:
            # Trying to release active gesture
            if self._active_gesture != GestureType.NONE:
                self._release_count += 1
                if self._release_count >= self.release_frames:
                    self._active_gesture = raw_gesture
                    self._release_count = 0
                    self._scroll_anchor_y = None
                return self._active_gesture
            else:
                self._active_gesture = raw_gesture
                return raw_gesture

        # New gesture candidate
        if raw_gesture == self._candidate_gesture:
            self._candidate_count += 1
        else:
            self._candidate_gesture = raw_gesture
            self._candidate_count = 1

        if self._candidate_count >= self.pinch_frames:
            self._active_gesture = raw_gesture
            self._candidate_gesture = GestureType.NONE
            self._candidate_count = 0
            self._release_count = 0

        return self._active_gesture

    def _is_fist(self, landmarks) -> bool:
        """Check if hand is making a fist (all 4 fingers closed)."""
        fingers = [
            (LM.INDEX_TIP, LM.INDEX_MCP),
            (LM.MIDDLE_TIP, LM.MIDDLE_MCP),
            (LM.RING_TIP, LM.RING_MCP),
            (LM.PINKY_TIP, LM.PINKY_MCP),
        ]
        closed_count = sum(
            1 for tip, mcp in fingers if _is_finger_closed(landmarks, tip, mcp)
        )
        return closed_count >= 4

    def _is_open_palm(self, landmarks) -> bool:
        """Check if hand is an open palm (all 4 fingers extended)."""
        fingers = [
            (LM.INDEX_TIP, LM.INDEX_MCP),
            (LM.MIDDLE_TIP, LM.MIDDLE_MCP),
            (LM.RING_TIP, LM.RING_MCP),
            (LM.PINKY_TIP, LM.PINKY_MCP),
        ]
        open_count = sum(
            1 for tip, mcp in fingers
            if not _is_finger_closed(landmarks, tip, mcp)
        )
        return open_count >= 4
