# Jarvis Local AI Assistant – Design & Best Practices Specification

## 1. Always-On-Top Avatar Window UX

Define a persistent floating avatar UI that remains visible above other windows without disrupting the user's workflow. The avatar should support three distinct states:

### States

- **MINI State**: A small, corner-mounted avatar window (e.g. an icon or tiny avatar) that can snap to screen edges/corners for unobtrusive placement. This state is used when the assistant is idle but available. The window should be always-on-top yet minimally sized.

- **ACTIVE State**: An expanded avatar window shown during interaction (voice conversation or when displaying a response). In this state, the window may show the conversation transcript or a status indicator (listening, thinking, speaking). It remains always on top and visible, but should not steal input focus from other apps. (On Windows, implement this by using a topmost window with the WS_EX_NOACTIVATE style so it stays above other apps without capturing focus. On macOS, use a utility panel (NSPanel or an NSWindow at NSFloatingWindowLevel) and disable auto-focus, e.g. by not making it key or using setIgnoresMouseEvents for click-through if needed.)

- **SLEEP State**: A minimal "indicator-only" mode when the assistant is not actively needed. This could be a tiny overlay or blinking dot near the edge of the screen to signal the assistant is running (or listening for a wake word). In SLEEP state, the avatar uses minimal screen real estate and CPU – essentially idle unless invoked.

### Window Behavior & Interaction Rules

- **Always-on-Top**: The avatar window at any state must use the OS-specific top-most window mechanism so that it stays above other windows. On Windows, create the window with TopMost=true (or HWND_TOPMOST) and no activation. On macOS, set window level to floating (above normal apps) and consider setVisibleOnAllWorkspaces(true) for Mission Control Spaces support. This ensures the avatar remains visible even when virtual desktops change or apps go full-screen.

- **Snap to Edges**: In MINI or SLEEP state, enable the window to snap to screen edges or corners when dragged, for convenient placement. This is a common UX pattern for floating widgets (similar to picture-in-picture video windows or chat heads).

- **Auto-Minimize**: Implement logic to automatically transition from ACTIVE back to MINI (or SLEEP) after a period of inactivity or when a task completes. For example, when a voice interaction finishes, after a few seconds the avatar can shrink back to MINI state. This keeps the UI out of the way when not in use.

- **No Focus Stealing**: The avatar window should never force itself to the foreground focus when appearing. It should allow the user to continue typing or working in another app if they were already doing so. (Technical note: use non-activating window styles as noted above. This prevents focus steal when the avatar is clicked or shown.)

- **Minimal Resource Usage**: Use lightweight graphics for the avatar. Prefer vector animations (SVG or Lottie JSON) or simple frame animations for any avatar movement/expressiveness, as these can be GPU-accelerated and efficient. For example, a looping Lottie animation can display the avatar "listening" or "thinking" with low CPU impact. However, be cautious: overly complex Lottie animations can tax CPU if not optimized. Aim for simple animations or low frame-rate updates. If using Lottie, consider rendering at a small resolution and scaling up, or using an optimized player. In some cases, a static SVG or a Sprite sheet might suffice for the SLEEP indicator to virtually eliminate CPU usage.

- **Animation and Feedback**: In ACTIVE state, the avatar can provide visual feedback (like a waveform when listening, or a glow when speaking). Use subtle animations (e.g. an SVG path morph or small Lottie animation) to indicate status without high CPU cost. Modern UI frameworks support such animations: for instance, a SwiftUI Canvas or an animated vector can replace a heavy Lottie file for simple effects. Always test the CPU/GPU load of the avatar's idle animation and optimize for <5% CPU on average machines.

### Platform Considerations

#### macOS
- Use an NSWindow or NSPanel with level = NSFloatingWindowLevel (or even NSStatusWindowLevel if appropriate) to keep it above regular windows.
- Call setCollectionBehavior(.canJoinAllSpaces) or equivalent so it appears on all Desktops (Spaces).
- If using AppKit/SwiftUI, set the window's isReleasedWhenClosed to false (to reuse it) and manage its visibility manually.
- Do not automatically hide on deactivate if you want it always visible (by default, utility windows hide when app is not active; adjust setHidesOnDeactivate:NO).
- Confirm that it does not appear in the Dock or task switcher – for example, use .setAllowsConcurrentViewDrawing(true) and [NSApp setActivationPolicy:.accessory] if making it a menu bar utility with no Dock icon.

#### Windows
- Create the avatar window using Win32 or a UI framework that allows always-on-top.
- For raw Win32, use WS_EX_TOPMOST extended style. Additionally use WS_EX_TOOLWINDOW (so it doesn't appear in taskbar) and WS_EX_NOACTIVATE to prevent focus capture.
- In frameworks like WPF/WinUI, set Topmost=True and possibly override window styles via PInvoke if needed to add NOACTIVATE.
- Test that if the user clicks the avatar, it does not steal focus from other apps – this may require handling the click events manually.

#### Electron/Tauri
- If using a web tech shell, make use of provided APIs.
- Electron's BrowserWindow supports alwaysOnTop: true and even specifying levels ("floating", "modal-panel", or "screen-saver" on macOS) for more control.
- Enable visibleOnAllWorkspaces: true on macOS to show across Spaces.
- Confirm that the Electron window's { focusable: false } or similar option is set when in passive mode to avoid focus issues.
- Tauri can leverage a similar approach via the Tao window API.

---

## 2. Desktop App Shell Plan (Mac & Windows)

Organize the assistant's application into clear modules, separating concerns to improve maintainability and cross-platform flexibility.

### Modules

#### Window Manager (UI Layer)
Responsible for rendering the Avatar window UI, dialogues, and any on-screen display of outputs. This layer should handle user interaction events (clicks, drags, etc.) and present information, but must not directly invoke LLM logic or tools. It communicates with the core logic via the LLM Router or other controllers.

#### Input Controller
Handles global input events such as the push-to-talk hotkey or other triggers. For example, it detects when the user presses the global shortcut (e.g. ⌥+Space) and then signals the system to start recording audio. The Input Controller orchestrates the start/stop of voice capture (or text input mode) and passes the captured input to the core.

#### Voice I/O (STT/TTS module)
Encapsulates Speech-to-Text and Text-to-Speech functionality. This module takes recorded audio from the mic (triggered by Input Controller) and performs transcription (STT) – likely using a local model (e.g. Whisper for Turkish). It also handles output speech: given a response text, produce audio (using a system TTS voice or an offline model).

#### LLM Router
The brain of the routing logic. All user queries (whether voice-transcribed text or typed commands) flow into the LLM Router. It decides how to handle the query:
- If the query matches a known deterministic command or tool, route to the Tool Executor without calling an LLM.
- If not a known command, route to an LLM (either local or via API) according to the Hybrid Policy.
- The UI never calls the LLM API/Model directly; it always goes through this router.

#### Memory Vault
A persistent storage module for any long-term data the assistant keeps. This includes user context, notes, tasks, and conversation history (if maintaining memory between sessions).

#### Task Runner / Tool Executor
Executes external actions or "tools" when commanded. If the LLM's response (or the Router's deterministic parse) indicates a tool should be run (e.g. open an app, fetch a webpage, run a calculation), this module handles it.

#### Logging & Audit
A module or service that captures events and errors from all other components. It should record each significant action to a log file for debugging and transparency.

### Architecture Flow

```
Input Controller → Voice STT → LLM Router → Tool Executor/LLM → Response Parser → TTS + Window Manager
                                    ↓
                              Memory Vault
                                    ↓
                              Logging & Audit
```

### Strict Layer Boundary
The UI/Window Manager must NEVER directly call the LLM service. It always goes through the LLM Router. This creates a clean separation between presentation and logic.

### Platform-Specific Shell Differences

| Feature | macOS | Windows |
|---------|-------|---------|
| Always-on-Top | NSFloatingWindowLevel | WS_EX_TOPMOST |
| System Tray | NSStatusItem (Menu Bar) | Shell_NotifyIcon |
| Global Hotkey | RegisterEventHotKey / Hammerspoon | RegisterHotKey |
| Background App | LSUIElement in Info.plist | Hide window, tray only |

---

## 3. Hybrid LLM Routing Policy

### Principles

- **Local-First by Default**: The assistant uses on-device LLM inference for most requests. All queries are handled by local models (running via Ollama, MLX or similar) – ensuring data stays on the user's machine for privacy.

- **Opt-in Cloud Usage**: Accessing powerful cloud models (e.g. GPT-4 via OpenAI API) is only done when explicitly enabled by the user. No private data should ever be sent to an external API without the user's consent.

- **"Upgrade" on Demand**: Provide an option for the user to request a higher-quality or more powerful model for a difficult task. E.g., "Jarvis, use advanced mode".

- **Source/Model Attribution**: Each response should clearly indicate which model produced it. E.g., "[Answer generated by Qwen-7B 🖥️]" or "[Answer from GPT-4 ☁️]".

### Routing Categories

| Category | Description | Model Selection |
|----------|-------------|-----------------|
| **Quick Commands** | Simple, short requests | Fast local model or deterministic regex |
| **Long/Complex Planning** | Complex reasoning, multi-step | Best local model, cloud if allowed |
| **Privacy-Sensitive** | Personal data, files, clipboard | LOCAL ONLY |
| **Web-Required** | Needs online information | Tool (search) or cloud if allowed |

### Routing Implementation

1. If query matches a deterministic intent (regex), execute that (bypass LLM)
2. Categorize query by expected complexity
3. Map category to policy
4. Check user's global settings (Offline-Only vs Hybrid Mode)
5. If cloud is an option, ensure API credentials and track usage limits

### Security & Privacy Safeguards

- NEVER send identifying data to cloud models without explicit permission
- Implement filtering: if prompt includes file contents, clipboard text, or system info and going to cloud → pause and prompt user
- Default to LOCAL for sensitive queries

---

## 4. MLX Integration Expectations

### OpenAI-API Compatible Endpoint

The local LLM server should expose a REST endpoint that mimics OpenAI's API format (e.g. `/v1/chat/completions`). The assistant will send requests to `http://localhost:<port>/v1` with the same JSON payload as it would to OpenAI.

### Model Profiles

| Profile | Target Latency | Model Size | Use Case |
|---------|---------------|------------|----------|
| **FAST** | < 2s | 7B quantized | Quick commands, simple Q&A |
| **BALANCED** | 3-6s | 13B | General purpose (default) |
| **QUALITY** | < 10s | 32B+ or GPT-4 | Complex reasoning, detailed answers |

### Requirements

- **Streaming Responses**: Must support `stream: true` for responsiveness
- **Seamless Switching**: User should switch profiles without restarting
- **Health Check**: Detect if MLX server not running on startup
- **Tool Integration**: Support `--enable-auto-tool-choice` if available

### Performance Targets

```
FAST:     < 2s for simple query ("Hello")
BALANCED: 3-6s for typical response
QUALITY:  < 10s for detailed explanation
```

---

## 5. Mouse & Keyboard Interaction Specification

### Global Hotkey Activation

- Default: ⌥+Space (Option+Space)
- Configurable in settings
- Should work even when other apps are focused
- Visual feedback on activation (glow, beep)

### System Tray / Menu Bar Menu

| Menu Item | Action |
|-----------|--------|
| 🎤 Listen | Start listening (same as hotkey) |
| 🔇 Mute/Unmute | Toggle voice activation |
| 📋 Last Result | Show last command result |
| ⚙️ Settings | Open configuration |
| 🚪 Exit | Clean shutdown |

### Drag-and-Drop Ingestion

- Avatar accepts file drag & drop
- Background processing (non-blocking)
- Security: Only accept allowed file types
- Acknowledgement: "📄 Ingesting file…"

### Mouse Click Actions

| State | Left Click | Right Click |
|-------|------------|-------------|
| MINI | Trigger listening | Context menu |
| ACTIVE | Text selection/copy | Context menu |
| Any | Drag to reposition | - |

### Audit Logging

All actions must be logged with timestamps:

```
[LOCAL] USER_ACTION: Hotkey pressed, recording audio
[LOCAL] LLM_QUERY: model=Qwen-7B, prompt=...
[API]   LLM_QUERY: model=GPT-4, usage will be logged
[LOCAL] TOOL_EXEC: open_browser http://...
```

### Confirmation for Dangerous Actions

High-impact actions require explicit user confirmation via modal dialog or voice prompt.

---

## Implementation Priority

1. **Phase 1**: Core Architecture
   - Window Manager with MINI/ACTIVE/SLEEP states
   - LLM Router with local-first policy
   - Basic Voice I/O

2. **Phase 2**: Enhanced UX
   - Snap-to-edge behavior
   - Drag-and-drop ingestion
   - System tray/menu bar integration

3. **Phase 3**: Advanced Features
   - Hybrid cloud routing
   - Model profile switching
   - Comprehensive audit logging

4. **Phase 4**: Polish
   - Animations and visual feedback
   - Performance optimization
   - Cross-platform testing
