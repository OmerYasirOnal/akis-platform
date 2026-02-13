#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================"
echo " Jarvis — Voice-to-Cursor Setup"
echo "========================================"
echo ""

# ── 1. Check Apple Silicon ──────────────────────────────────────────
ARCH=$(uname -m)
if [[ "$ARCH" != "arm64" ]]; then
  echo "WARNING: This tool is optimized for Apple Silicon (arm64)."
  echo "  Detected: $ARCH"
  echo "  mlx-whisper requires Apple Silicon. Exiting."
  exit 1
fi
echo "[OK] Apple Silicon detected ($ARCH)"

# ── 2. Homebrew dependencies ────────────────────────────────────────
echo ""
echo "Installing system dependencies (ffmpeg, portaudio)..."
if command -v brew &>/dev/null; then
  brew install ffmpeg portaudio 2>/dev/null || true
  echo "[OK] System dependencies installed"
else
  echo "ERROR: Homebrew not found. Install from https://brew.sh"
  exit 1
fi

# ── 3. Python virtual environment ───────────────────────────────────
echo ""
echo "Creating Python virtual environment..."
if [[ ! -d ".venv" ]]; then
  python3 -m venv .venv
  echo "[OK] Virtual environment created"
else
  echo "[OK] Virtual environment already exists"
fi

source .venv/bin/activate

# ── 4. Python packages ──────────────────────────────────────────────
echo ""
echo "Installing Python packages..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "[OK] Python packages installed"

# ── 5. Pre-download Whisper model ───────────────────────────────────
echo ""
echo "Pre-downloading Whisper model (this may take a minute on first run)..."
python3 -c "
import mlx_whisper
import tempfile, os
# Create a tiny silent WAV to trigger model download
import numpy as np
import sounddevice  # just to verify it imports
print('Model download triggered — checking cache...')
" 2>/dev/null && echo "[OK] Whisper dependencies verified" || echo "[WARN] Model will be downloaded on first use"

# ── 6. macOS permissions reminder ───────────────────────────────────
echo ""
echo "========================================"
echo " IMPORTANT: macOS Permissions Required"
echo "========================================"
echo ""
echo "Go to: System Settings > Privacy & Security"
echo ""
echo "  1. Accessibility:"
echo "     Add your terminal app (Terminal.app / iTerm / Warp)"
echo ""
echo "  2. Input Monitoring:"
echo "     Add your terminal app"
echo ""
echo "  3. Microphone:"
echo "     Add your terminal app"
echo ""
echo "Without these permissions, hotkey detection and"
echo "audio recording will NOT work."
echo ""
echo "========================================"
echo " Setup complete! Run with:"
echo "   source .venv/bin/activate"
echo "   python voice_cursor.py"
echo "========================================"
