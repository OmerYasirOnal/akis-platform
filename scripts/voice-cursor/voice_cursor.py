#!/usr/bin/env python3
"""
Jarvis — Voice-to-Cursor: Push-to-talk voice command system for Cursor IDE.

Hold a hotkey to record your voice, release to transcribe with local Whisper,
and automatically send the prompt to Cursor (via IDE keyboard simulation or
the agent CLI).

Optimized for Apple Silicon (M-series) using mlx-whisper.
"""

from __future__ import annotations

import io
import os
import sys
import time
import shutil
import signal
import logging
import tempfile
import threading
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional

import yaml
import numpy as np
import sounddevice as sd

# ─── Logging ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("jarvis")

# ─── Constants ──────────────────────────────────────────────────────────────

SAMPLE_RATE = 16000  # Whisper expects 16 kHz mono
CHANNELS = 1
DTYPE = "float32"
CONFIG_PATH = Path(__file__).parent / "config.yaml"
VERSION = "1.0.0"

# ─── Configuration ──────────────────────────────────────────────────────────


def load_config() -> dict:
    """Load configuration from config.yaml with sensible defaults."""
    defaults = {
        "hotkey": {"combo": "ctrl+shift+space"},
        "whisper": {
            "model": "mlx-community/whisper-large-v3-turbo",
            "language": "auto",
        },
        "dispatch": {
            "mode": "ide",
            "workspace": None,
            "cli_model": None,
            "cli_mode": None,
        },
        "prompt": {"prefix": "", "suffix": "", "template": None},
        "notifications": {"sound": True, "banner": True},
    }

    if CONFIG_PATH.exists():
        with open(CONFIG_PATH, "r") as f:
            user_cfg = yaml.safe_load(f) or {}
        # Merge: user overrides defaults (shallow per top-level key)
        for section, section_defaults in defaults.items():
            if section in user_cfg and isinstance(section_defaults, dict):
                section_defaults.update(user_cfg[section])
                defaults[section] = section_defaults
            elif section in user_cfg:
                defaults[section] = user_cfg[section]
    else:
        log.warning("Config file not found at %s — using defaults", CONFIG_PATH)

    return defaults


# ─── macOS Notifications ────────────────────────────────────────────────────


def notify(title: str, message: str, sound: bool = False):
    """Send a macOS notification banner via osascript."""
    sound_part = 'sound name "Ping"' if sound else ""
    script = (
        f'display notification "{message}" '
        f'with title "{title}" {sound_part}'
    )
    try:
        subprocess.run(
            ["osascript", "-e", script],
            capture_output=True,
            timeout=5,
        )
    except Exception:
        pass  # notifications are best-effort


def play_system_sound(name: str = "Ping"):
    """Play a macOS system sound."""
    sound_path = f"/System/Library/Sounds/{name}.aiff"
    if os.path.exists(sound_path):
        try:
            subprocess.Popen(
                ["afplay", sound_path],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except Exception:
            pass


# ─── Whisper Transcription ──────────────────────────────────────────────────

_whisper_model_cache = {}


def transcribe_audio(audio_data: np.ndarray, config: dict) -> str:
    """Transcribe audio using mlx-whisper (local, Apple Silicon optimized)."""
    import mlx_whisper

    model_repo = config["whisper"]["model"]
    language = config["whisper"]["language"]

    # Write audio to a temporary WAV file (mlx-whisper expects file path)
    import wave

    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    try:
        with wave.open(tmp.name, "wb") as wf:
            wf.setnchannels(CHANNELS)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(SAMPLE_RATE)
            # Convert float32 [-1, 1] to int16
            audio_int16 = (audio_data * 32767).astype(np.int16)
            wf.writeframes(audio_int16.tobytes())

        # Transcribe
        kwargs = {"path_or_hf_repo": model_repo}
        if language and language != "auto":
            kwargs["language"] = language

        log.info("Transcribing with %s...", model_repo.split("/")[-1])
        start = time.time()
        result = mlx_whisper.transcribe(tmp.name, **kwargs)
        elapsed = time.time() - start
        text = result.get("text", "").strip()
        log.info("Transcription done in %.1fs: %s", elapsed, text[:80] + ("..." if len(text) > 80 else ""))
        return text
    finally:
        os.unlink(tmp.name)


# ─── Prompt Formatting ──────────────────────────────────────────────────────


def format_prompt(text: str, config: dict) -> str:
    """Apply prefix, suffix, and template from config to the transcribed text."""
    prompt_cfg = config["prompt"]

    if prompt_cfg.get("template"):
        formatted = prompt_cfg["template"].replace("{text}", text)
    else:
        prefix = prompt_cfg.get("prefix", "")
        suffix = prompt_cfg.get("suffix", "")
        parts = []
        if prefix:
            parts.append(prefix)
        parts.append(text)
        if suffix:
            parts.append(suffix)
        formatted = " ".join(parts)

    return formatted.strip()


# ─── Dispatch to Cursor ─────────────────────────────────────────────────────


def dispatch_ide(prompt: str, config: dict):
    """Send prompt to Cursor IDE via macOS keyboard simulation."""
    import subprocess

    # Copy prompt to clipboard
    process = subprocess.Popen(["pbcopy"], stdin=subprocess.PIPE)
    process.communicate(prompt.encode("utf-8"))

    # Activate Cursor and simulate Cmd+L → paste → Enter
    applescript = """
    tell application "Cursor" to activate
    delay 0.4
    tell application "System Events"
        keystroke "l" using command down
        delay 0.6
        keystroke "v" using command down
        delay 0.3
        keystroke return
    end tell
    """
    try:
        subprocess.run(
            ["osascript", "-e", applescript],
            capture_output=True,
            timeout=10,
        )
        log.info("Prompt sent to Cursor IDE (Cmd+L → paste → Enter)")
    except subprocess.TimeoutExpired:
        log.error("Timeout sending to Cursor IDE")
    except Exception as e:
        log.error("Failed to send to Cursor IDE: %s", e)


def dispatch_cli(prompt: str, config: dict):
    """Send prompt to Cursor via the agent CLI."""
    dispatch_cfg = config["dispatch"]

    cmd = ["agent"]

    # Add workspace
    workspace = dispatch_cfg.get("workspace")
    if workspace:
        cmd.extend(["--workspace", workspace])

    # Add model
    model = dispatch_cfg.get("cli_model")
    if model:
        cmd.extend(["--model", model])

    # Add mode
    mode = dispatch_cfg.get("cli_mode")
    if mode:
        cmd.extend(["--mode", mode])

    # Add the prompt
    cmd.append(prompt)

    log.info("Dispatching via agent CLI: %s", " ".join(cmd[:4]) + "...")
    try:
        subprocess.Popen(
            cmd,
            stdout=sys.stdout,
            stderr=sys.stderr,
        )
    except FileNotFoundError:
        log.error(
            "agent CLI not found. Install: curl https://cursor.com/install -fsSL | bash"
        )
    except Exception as e:
        log.error("Failed to dispatch via agent CLI: %s", e)


def dispatch(prompt: str, config: dict):
    """Route prompt to the configured dispatch method."""
    mode = config["dispatch"]["mode"]
    if mode == "cli":
        dispatch_cli(prompt, config)
    else:
        dispatch_ide(prompt, config)


# ─── Audio Recording ────────────────────────────────────────────────────────


class AudioRecorder:
    """Thread-safe push-to-talk audio recorder using sounddevice."""

    def __init__(self):
        self._frames: list[np.ndarray] = []
        self._stream = None
        self._recording = False
        self._lock = threading.Lock()

    @property
    def is_recording(self) -> bool:
        return self._recording

    def start(self):
        """Start recording audio from the default microphone."""
        with self._lock:
            if self._recording:
                return
            self._frames = []
            self._recording = True

        def callback(indata, frames, time_info, status):
            if status:
                log.warning("Audio status: %s", status)
            if self._recording:
                self._frames.append(indata.copy())

        self._stream = sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype=DTYPE,
            callback=callback,
            blocksize=1024,
        )
        self._stream.start()
        log.info("Recording started...")

    def stop(self) -> Optional[np.ndarray]:
        """Stop recording and return the captured audio as a numpy array."""
        with self._lock:
            if not self._recording:
                return None
            self._recording = False

        if self._stream:
            self._stream.stop()
            self._stream.close()
            self._stream = None

        if not self._frames:
            log.warning("No audio frames captured")
            return None

        audio = np.concatenate(self._frames, axis=0).flatten()
        duration = len(audio) / SAMPLE_RATE
        log.info("Recording stopped — %.1f seconds captured", duration)

        # Discard very short recordings (< 0.5s, likely accidental)
        if duration < 0.5:
            log.warning("Recording too short (%.1fs), discarding", duration)
            return None

        return audio


# ─── Hotkey Listener ────────────────────────────────────────────────────────


def parse_hotkey_combo(combo_str: str):
    """Parse a hotkey combo string like 'ctrl+shift+space' into pynput keys."""
    from pynput.keyboard import Key, KeyCode

    key_map = {
        "ctrl": Key.ctrl,
        "ctrl_l": Key.ctrl_l,
        "ctrl_r": Key.ctrl_r,
        "shift": Key.shift,
        "shift_l": Key.shift_l,
        "shift_r": Key.shift_r,
        "alt": Key.alt,
        "alt_l": Key.alt_l,
        "alt_r": Key.alt_r,
        "cmd": Key.cmd,
        "cmd_l": Key.cmd_l,
        "cmd_r": Key.cmd_r,
        "space": Key.space,
        "tab": Key.tab,
        "enter": Key.enter,
        "esc": Key.esc,
        "f1": Key.f1,
        "f2": Key.f2,
        "f3": Key.f3,
        "f4": Key.f4,
        "f5": Key.f5,
        "f6": Key.f6,
        "f7": Key.f7,
        "f8": Key.f8,
        "f9": Key.f9,
        "f10": Key.f10,
        "f11": Key.f11,
        "f12": Key.f12,
    }

    parts = [p.strip().lower() for p in combo_str.split("+")]
    modifiers = set()
    trigger_key = None

    for part in parts:
        if part in key_map:
            key = key_map[part]
            # Last key in combo is the trigger, rest are modifiers
            if trigger_key is not None:
                modifiers.add(trigger_key)
            trigger_key = key
        else:
            # Single character key
            if trigger_key is not None:
                modifiers.add(trigger_key)
            trigger_key = KeyCode.from_char(part)

    return modifiers, trigger_key


class HotkeyManager:
    """Manages push-to-talk hotkey detection using pynput."""

    def __init__(self, combo_str: str, on_press_cb, on_release_cb):
        self._modifiers, self._trigger = parse_hotkey_combo(combo_str)
        self._on_press_cb = on_press_cb
        self._on_release_cb = on_release_cb
        self._pressed_keys = set()
        self._hotkey_active = False
        self._listener = None

    def _normalize_key(self, key):
        """Normalize key variants (e.g., ctrl_l/ctrl_r → ctrl)."""
        from pynput.keyboard import Key

        normalize_map = {
            Key.ctrl_l: Key.ctrl,
            Key.ctrl_r: Key.ctrl,
            Key.shift_l: Key.shift,
            Key.shift_r: Key.shift,
            Key.alt_l: Key.alt,
            Key.alt_r: Key.alt,
            Key.cmd_l: Key.cmd,
            Key.cmd_r: Key.cmd,
        }
        return normalize_map.get(key, key)

    def _on_press(self, key):
        normalized = self._normalize_key(key)
        self._pressed_keys.add(normalized)

        # Check if all modifiers + trigger are pressed
        if (
            not self._hotkey_active
            and self._modifiers.issubset(self._pressed_keys)
            and normalized == self._trigger
        ):
            self._hotkey_active = True
            self._on_press_cb()

    def _on_release(self, key):
        normalized = self._normalize_key(key)
        self._pressed_keys.discard(normalized)

        # Also discard the un-normalized version
        if key != normalized:
            self._pressed_keys.discard(key)

        # If trigger or any modifier released, stop recording
        if self._hotkey_active:
            if (
                normalized == self._trigger
                or not self._modifiers.issubset(self._pressed_keys)
            ):
                self._hotkey_active = False
                self._on_release_cb()

    def start(self):
        """Start listening for the hotkey."""
        from pynput.keyboard import Listener

        self._listener = Listener(
            on_press=self._on_press,
            on_release=self._on_release,
        )
        self._listener.daemon = True
        self._listener.start()

    def stop(self):
        """Stop the hotkey listener."""
        if self._listener:
            self._listener.stop()


# ─── Main Application ───────────────────────────────────────────────────────


class Jarvis:
    """Main application: ties together recording, transcription, and dispatch."""

    def __init__(self):
        self.config = load_config()
        self.recorder = AudioRecorder()
        self._processing = False
        self._lock = threading.Lock()

    def on_hotkey_press(self):
        """Called when the push-to-talk hotkey is pressed."""
        if self._processing:
            log.debug("Still processing previous recording, ignoring")
            return

        if self.config["notifications"]["sound"]:
            play_system_sound("Tink")

        self.recorder.start()

    def on_hotkey_release(self):
        """Called when the push-to-talk hotkey is released."""
        audio = self.recorder.stop()
        if audio is None:
            return

        if self.config["notifications"]["sound"]:
            play_system_sound("Pop")

        # Process in a separate thread to avoid blocking the hotkey listener
        thread = threading.Thread(target=self._process, args=(audio,), daemon=True)
        thread.start()

    def _process(self, audio: np.ndarray):
        """Transcribe and dispatch audio in a background thread."""
        with self._lock:
            if self._processing:
                return
            self._processing = True

        try:
            # Transcribe
            text = transcribe_audio(audio, self.config)
            if not text:
                log.warning("Empty transcription, skipping dispatch")
                if self.config["notifications"]["banner"]:
                    notify("Jarvis", "Empty transcription — try again")
                return

            # Format prompt
            prompt = format_prompt(text, self.config)
            log.info("Prompt: %s", prompt)

            # Notify
            if self.config["notifications"]["banner"]:
                display_text = prompt[:60] + ("..." if len(prompt) > 60 else "")
                notify("Jarvis — Sending to Cursor", display_text, sound=False)

            # Dispatch
            dispatch(prompt, self.config)

        except Exception as e:
            log.error("Processing failed: %s", e, exc_info=True)
            if self.config["notifications"]["banner"]:
                notify("Jarvis — Error", str(e)[:80])
        finally:
            self._processing = False

    def run(self):
        """Start Jarvis and listen for the hotkey."""
        combo = self.config["hotkey"]["combo"]
        mode = self.config["dispatch"]["mode"]

        print()
        print("  ╔══════════════════════════════════════════╗")
        print("  ║         JARVIS — Voice to Cursor         ║")
        print(f"  ║  v{VERSION}                                  ║")
        print("  ╠══════════════════════════════════════════╣")
        print(f"  ║  Hotkey  : {combo:<30}║")
        print(f"  ║  Mode    : {mode:<30}║")
        print(f"  ║  Whisper : {self.config['whisper']['model'].split('/')[-1]:<30}║")
        print(f"  ║  Language: {self.config['whisper']['language']:<30}║")
        print("  ╠══════════════════════════════════════════╣")
        print("  ║  Hold hotkey to record, release to send  ║")
        print("  ║  Press Ctrl+C to quit                    ║")
        print("  ╚══════════════════════════════════════════╝")
        print()

        hotkey_mgr = HotkeyManager(
            combo,
            on_press_cb=self.on_hotkey_press,
            on_release_cb=self.on_hotkey_release,
        )
        hotkey_mgr.start()
        log.info("Jarvis is listening... (hotkey: %s)", combo)

        # Startup notification
        if self.config["notifications"]["banner"]:
            notify("Jarvis Active", f"Hotkey: {combo} | Mode: {mode}", sound=True)

        # Keep main thread alive
        try:
            signal.signal(signal.SIGINT, lambda *_: sys.exit(0))
            while True:
                time.sleep(1)
        except (KeyboardInterrupt, SystemExit):
            hotkey_mgr.stop()
            log.info("Jarvis stopped.")
            print("\nJarvis stopped. Goodbye!")


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Quick argument handling
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg in ("--version", "-v"):
            print(f"Jarvis v{VERSION}")
            sys.exit(0)
        elif arg in ("--help", "-h"):
            print(f"Jarvis v{VERSION} — Voice-to-Cursor")
            print()
            print("Usage: python voice_cursor.py [options]")
            print()
            print("Options:")
            print("  --version, -v    Show version")
            print("  --help, -h       Show this help")
            print("  --test-mic       Test microphone (3 second recording)")
            print("  --test-whisper   Test Whisper with a mic recording")
            print()
            print(f"Config: {CONFIG_PATH}")
            sys.exit(0)
        elif arg == "--test-mic":
            print("Testing microphone — recording 3 seconds...")
            rec = AudioRecorder()
            rec.start()
            time.sleep(3)
            audio = rec.stop()
            if audio is not None:
                peak = np.max(np.abs(audio))
                print(f"OK — captured {len(audio)/SAMPLE_RATE:.1f}s, peak amplitude: {peak:.4f}")
                if peak < 0.01:
                    print("WARNING: Very low audio level. Check your microphone.")
            else:
                print("FAILED — no audio captured")
            sys.exit(0)
        elif arg == "--test-whisper":
            print("Testing Whisper — recording 5 seconds, then transcribing...")
            config = load_config()
            rec = AudioRecorder()
            rec.start()
            time.sleep(5)
            audio = rec.stop()
            if audio is not None:
                text = transcribe_audio(audio, config)
                print(f"\nTranscription: {text}")
            else:
                print("FAILED — no audio captured")
            sys.exit(0)

    jarvis = Jarvis()
    jarvis.run()
