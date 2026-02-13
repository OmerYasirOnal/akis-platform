"""
Hand gesture recognition v3 — Drag, double-click, adaptive thresholds.

Gesture hierarchy (priority order):
  1. FIST → pause tracking
  2. OPEN_PALM → stop/reset
  3. PINCH (thumb+index touching) → click / drag
  4. RIGHT_CLICK (thumb+middle touching)
  5. SCROLL (thumb+ring touching)
  6. PINCH_READY (approaching) → visual indicator
  7. POINT (index extended) → move cursor
  8. NONE

New in v3:
  - DRAG mode: pinch held for >0.3s while moving = drag
  - Double-click: two pinches within 0.4s
  - Better finger state detection using PIP joints
"""

from __future__ import annotations

import math
import time
from enum import Enum, auto
from typing import Optional, Tuple


# ─── Landmark IDs ────────────────────────────────────────────────────────────

class LM:
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
    POINT = auto()
    PINCH = auto()
    PINCH_READY = auto()
    DRAG = auto()           # NEW: pinch held + hand moving
    RIGHT_CLICK = auto()
    SCROLL = auto()
    FIST = auto()
    OPEN_PALM = auto()


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _distance(a, b) -> float:
    return math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)


def _is_finger_extended(landmarks, tip_id: int, pip_id: int, mcp_id: int) -> bool:
    wrist = landmarks[LM.WRIST]
    tip = landmarks[tip_id]
    pip_j = landmarks[pip_id]
    return _distance(tip, wrist) > _distance(pip_j, wrist)


def _is_finger_curled(landmarks, tip_id: int, pip_id: int, mcp_id: int) -> bool:
    return not _is_finger_extended(landmarks, tip_id, pip_id, mcp_id)


# ─── Gesture Detector v3 ────────────────────────────────────────────────────

class GestureDetector:
    """
    v3 gesture detector with drag support and double-click.
    """

    def __init__(
        self,
        pinch_threshold: float = 0.030,
        right_click_threshold: float = 0.035,
        scroll_threshold: float = 0.040,
        pinch_ready_threshold: float = 0.065,
        pinch_frames: int = 3,
        release_frames: int = 2,
        drag_hold_time: float = 0.35,
        double_click_window: float = 0.45,
    ):
        self.pinch_threshold = pinch_threshold
        self.right_click_threshold = right_click_threshold
        self.scroll_threshold = scroll_threshold
        self.pinch_ready_threshold = pinch_ready_threshold
        self.pinch_frames = pinch_frames
        self.release_frames = release_frames
        self.drag_hold_time = drag_hold_time
        self.double_click_window = double_click_window

        # Temporal state
        self._active_gesture = GestureType.NONE
        self._candidate_gesture = GestureType.NONE
        self._candidate_count = 0
        self._release_count = 0

        # Drag tracking
        self._pinch_start_time: Optional[float] = None
        self._is_dragging = False

        # Double-click tracking
        self._last_click_time: float = 0.0
        self._click_count: int = 0

        # Scroll
        self._scroll_anchor_y: Optional[float] = None

        # Debug
        self.debug_distances: dict = {}

    @property
    def active_gesture(self) -> GestureType:
        return self._active_gesture

    @property
    def is_dragging(self) -> bool:
        return self._is_dragging

    def reset(self):
        self._active_gesture = GestureType.NONE
        self._candidate_gesture = GestureType.NONE
        self._candidate_count = 0
        self._release_count = 0
        self._pinch_start_time = None
        self._is_dragging = False
        self._scroll_anchor_y = None

    def detect(self, landmarks) -> GestureType:
        raw = self._detect_raw(landmarks)
        filtered = self._apply_temporal_filter(raw)

        # Drag logic: pinch held for drag_hold_time → becomes DRAG
        now = time.time()
        if filtered == GestureType.PINCH:
            if self._pinch_start_time is None:
                self._pinch_start_time = now
            elif (now - self._pinch_start_time) > self.drag_hold_time:
                self._is_dragging = True
                return GestureType.DRAG
        else:
            if self._is_dragging:
                self._is_dragging = False
            self._pinch_start_time = None

        return filtered

    def check_double_click(self) -> bool:
        """
        Call this when a PINCH is first detected (edge trigger).
        Returns True if this is a double-click.
        """
        now = time.time()
        if (now - self._last_click_time) < self.double_click_window:
            self._click_count += 1
        else:
            self._click_count = 1
        self._last_click_time = now

        if self._click_count >= 2:
            self._click_count = 0
            return True
        return False

    def get_scroll_delta(self, landmarks) -> float:
        if self._active_gesture != GestureType.SCROLL:
            self._scroll_anchor_y = None
            return 0.0

        index_y = landmarks[LM.INDEX_TIP].y
        if self._scroll_anchor_y is None:
            self._scroll_anchor_y = index_y
            return 0.0

        delta = (self._scroll_anchor_y - index_y) * 15.0
        self._scroll_anchor_y = index_y
        return delta

    def get_pointer_position(self, landmarks) -> Tuple[float, float]:
        tip = landmarks[LM.INDEX_TIP]
        return (tip.x, tip.y)

    def _detect_raw(self, landmarks) -> GestureType:
        thumb = landmarks[LM.THUMB_TIP]
        index = landmarks[LM.INDEX_TIP]
        middle = landmarks[LM.MIDDLE_TIP]
        ring = landmarks[LM.RING_TIP]

        d_ti = _distance(thumb, index)
        d_tm = _distance(thumb, middle)
        d_tr = _distance(thumb, ring)

        self.debug_distances = {
            "thumb_index": d_ti,
            "thumb_middle": d_tm,
            "thumb_ring": d_tr,
        }

        if self._is_fist(landmarks):
            return GestureType.FIST

        if self._is_open_palm(landmarks):
            return GestureType.OPEN_PALM

        if d_ti < self.pinch_threshold:
            return GestureType.PINCH

        if d_tm < self.right_click_threshold:
            return GestureType.RIGHT_CLICK

        if d_tr < self.scroll_threshold:
            return GestureType.SCROLL

        if d_ti < self.pinch_ready_threshold:
            return GestureType.PINCH_READY

        if self._is_pointing(landmarks):
            return GestureType.POINT

        return GestureType.NONE

    def _apply_temporal_filter(self, raw: GestureType) -> GestureType:
        if raw == GestureType.PINCH_READY:
            if self._active_gesture in (GestureType.NONE, GestureType.POINT, GestureType.PINCH_READY):
                return GestureType.PINCH_READY
            return self._active_gesture

        if raw == self._active_gesture:
            self._release_count = 0
            self._candidate_gesture = GestureType.NONE
            self._candidate_count = 0
            return self._active_gesture

        if raw in (GestureType.NONE, GestureType.POINT):
            if self._active_gesture not in (GestureType.NONE, GestureType.POINT, GestureType.PINCH_READY):
                self._release_count += 1
                if self._release_count >= self.release_frames:
                    self._active_gesture = raw
                    self._release_count = 0
                    self._scroll_anchor_y = None
                return self._active_gesture
            else:
                self._active_gesture = raw
                return raw

        if raw == self._candidate_gesture:
            self._candidate_count += 1
        else:
            self._candidate_gesture = raw
            self._candidate_count = 1

        if self._candidate_count >= self.pinch_frames:
            self._active_gesture = raw
            self._candidate_gesture = GestureType.NONE
            self._candidate_count = 0
            self._release_count = 0

        return self._active_gesture

    def _is_fist(self, landmarks) -> bool:
        fingers = [
            (LM.INDEX_TIP, LM.INDEX_PIP, LM.INDEX_MCP),
            (LM.MIDDLE_TIP, LM.MIDDLE_PIP, LM.MIDDLE_MCP),
            (LM.RING_TIP, LM.RING_PIP, LM.RING_MCP),
            (LM.PINKY_TIP, LM.PINKY_PIP, LM.PINKY_MCP),
        ]
        return sum(1 for t, p, m in fingers if _is_finger_curled(landmarks, t, p, m)) >= 4

    def _is_open_palm(self, landmarks) -> bool:
        fingers = [
            (LM.INDEX_TIP, LM.INDEX_PIP, LM.INDEX_MCP),
            (LM.MIDDLE_TIP, LM.MIDDLE_PIP, LM.MIDDLE_MCP),
            (LM.RING_TIP, LM.RING_PIP, LM.RING_MCP),
            (LM.PINKY_TIP, LM.PINKY_PIP, LM.PINKY_MCP),
        ]
        return sum(1 for t, p, m in fingers if _is_finger_extended(landmarks, t, p, m)) >= 4

    def _is_pointing(self, landmarks) -> bool:
        index_ext = _is_finger_extended(landmarks, LM.INDEX_TIP, LM.INDEX_PIP, LM.INDEX_MCP)
        middle_curled = _is_finger_curled(landmarks, LM.MIDDLE_TIP, LM.MIDDLE_PIP, LM.MIDDLE_MCP)
        ring_curled = _is_finger_curled(landmarks, LM.RING_TIP, LM.RING_PIP, LM.RING_MCP)
        return index_ext and (middle_curled or ring_curled)
