#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo " Hand Cursor — El Takibi Setup"
echo "========================================"
echo ""

# ── 1. Check Apple Silicon ──────────────────────────────────────────
ARCH=$(uname -m)
if [[ "$ARCH" != "arm64" ]]; then
  echo "WARNING: Optimized for Apple Silicon (arm64). Detected: $ARCH"
fi
echo "[OK] Architecture: $ARCH"

# ── 2. Check/Install Python 3.12 ────────────────────────────────────
echo ""
echo "Checking Python version..."
if command -v python3.12 &>/dev/null; then
  PY=python3.12
  echo "[OK] Python 3.12 found: $(python3.12 --version)"
elif command -v python3.13 &>/dev/null; then
  PY=python3.13
  echo "[OK] Python 3.13 found: $(python3.13 --version)"
else
  echo "Python 3.12+ not found. Installing via Homebrew..."
  if command -v brew &>/dev/null; then
    brew install python@3.12
    PY=python3.12
    echo "[OK] Python 3.12 installed"
  else
    echo "ERROR: Homebrew not found. Install from https://brew.sh"
    exit 1
  fi
fi

# ── 3. Python virtual environment ───────────────────────────────────
echo ""
echo "Creating Python virtual environment with $PY..."
if [[ ! -d ".venv" ]]; then
  $PY -m venv .venv
  echo "[OK] Virtual environment created (.venv/)"
else
  echo "[OK] Virtual environment already exists"
fi

source .venv/bin/activate
echo "[OK] Using Python: $(python --version)"

# ── 4. Python packages ──────────────────────────────────────────────
echo ""
echo "Installing Python packages..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "[OK] Python packages installed"

# ── 5. Verify imports ───────────────────────────────────────────────
echo ""
echo "Verifying imports..."
python -c "
import mediapipe
import cv2
import numpy
import Quartz
import yaml
print(f'  mediapipe  {mediapipe.__version__}')
print(f'  opencv     {cv2.__version__}')
print(f'  numpy      {numpy.__version__}')
print(f'  Quartz     OK')
print(f'  pyyaml     OK')
" && echo "[OK] All imports verified" || {
  echo "[ERROR] Import verification failed"
  exit 1
}

# ── 6. macOS permissions reminder ───────────────────────────────────
echo ""
echo "========================================"
echo " IMPORTANT: macOS Permissions Required"
echo "========================================"
echo ""
echo "Go to: System Settings > Privacy & Security"
echo ""
echo "  1. Camera:"
echo "     Allow your terminal app to access the camera"
echo ""
echo "  2. Accessibility:"
echo "     Add your terminal app (for cursor control)"
echo ""
echo "Without these permissions, camera and cursor"
echo "control will NOT work."
echo ""
echo "========================================"
echo " Setup complete! Run with:"
echo "   source .venv/bin/activate"
echo "   python hand_cursor.py"
echo "========================================"
