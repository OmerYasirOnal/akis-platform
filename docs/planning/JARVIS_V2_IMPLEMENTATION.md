# Jarvis v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Evolve Jarvis from standalone voice assistant into AKIS Platform agent with fixed UI, Kumru LLM (MLX-first + Piri RAG), learning system, and full web agent.

**Architecture:** Jarvis moves into devagents/jarvis/ as the 4th AKIS agent. SwiftUI UI gets bigger sizes, ChatGPT-style bubbles, manual close. Python backend uses MLX-LM Gateway (Apple Silicon optimized) as primary inference with Ollama fallback and cloud API option, bridged through Piri RAG (Kumru LLM). New web_search and web_scraper modules enable full web agent. Memory system enhanced with user profiles.

**Tech Stack:** SwiftUI 5.9+, Python 3.10+, MLX-LM (Apple Silicon), Ollama (fallback), Piri RAG (FastAPI), Brave Search API, BeautifulSoup4

---

## Phase 0: Repo Migration

### Task 1: Copy Jarvis into devagents/

**Files:**
- Source: `/Users/omeryasironal/jarvis/` (entire directory)
- Destination: `/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/jarvis/`

**Step 1: Copy the jarvis directory**

```bash
cp -r /Users/omeryasironal/jarvis/ /Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/jarvis/
```

**Step 2: Remove git history and build artifacts from the copy**

```bash
cd /Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/jarvis
rm -rf .git .build __pycache__ logs/ state/ memory/ingested/ memory/analysis/
```

**Step 3: Verify the copy**

```bash
ls -la /Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/jarvis/
ls -la /Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/jarvis/JarvisUI/JarvisUI/
ls -la /Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/jarvis/core/
```

Expected: JarvisUI/, core/, config/, tests/, requirements.txt, etc.

**Step 4: Commit**

```bash
cd /Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment
git add devagents/jarvis/
git commit -m "feat(jarvis): add Jarvis voice agent to AKIS platform"
```

---

## Phase 1: UI/UX Fixes

> All file paths below are relative to `devagents/jarvis/` after migration.
> Absolute base: `/Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment/devagents/jarvis/`

### Task 2: Update Window Dimensions

**Files:**
- Modify: `JarvisUI/JarvisUI/AvatarState.swift:11-13` (window sizes)
- Modify: `JarvisUI/JarvisUI/AvatarState.swift:19-20` (corner radii)

**Step 1: Change window sizes in AvatarState.swift**

In `AvatarState.swift`, find the `AvatarWindowState` enum computed properties (around lines 11-13). Change:

```swift
// OLD (line 11-13):
case .mini: return CGSize(width: 60, height: 60)
case .active: return CGSize(width: 400, height: 580)
case .sleep: return CGSize(width: 24, height: 24)

// NEW:
case .mini: return CGSize(width: 120, height: 120)
case .active: return CGSize(width: 500, height: 700)
case .sleep: return CGSize(width: 40, height: 40)
```

**Step 2: Update corner radii**

```swift
// OLD (line 19-20):
case .mini: return 30
case .active: return 16

// NEW:
case .mini: return 60
case .active: return 20
```

**Step 3: Verify build**

```bash
cd devagents/jarvis/JarvisUI && swift build 2>&1 | tail -5
```

Expected: Build Succeeded

**Step 4: Commit**

```bash
git add JarvisUI/JarvisUI/AvatarState.swift
git commit -m "feat(jarvis/ui): increase window sizes - mini 120x120, active 500x700, sleep 40x40"
```

### Task 3: Scale HologramAvatar for 120x120

**Files:**
- Modify: `JarvisUI/JarvisUI/HologramAvatar.swift:62-100` (ring sizes)
- Modify: `JarvisUI/JarvisUI/HologramAvatar.swift:153` (J font size)

**Step 1: Scale the particle ring and concentric rings**

```swift
// OLD (line 62-64): ParticleRing 180x180
// NEW: Scale to fill 120x120 better (but keep some margin)
// ParticleRing frame = 110x110

// OLD (line 82): Outer ring = 150x150
// NEW: Outer ring = 100x100

// OLD (line 100): Inner ring = 130x130
// NEW: Inner ring = 85x85
```

**Step 2: Scale J text**

```swift
// OLD (line 153): .font(.system(size: 50, ...))
// NEW: .font(.system(size: 40, ...))
```

**Step 3: Verify build**

```bash
cd devagents/jarvis/JarvisUI && swift build 2>&1 | tail -5
```

**Step 4: Commit**

```bash
git add JarvisUI/JarvisUI/HologramAvatar.swift
git commit -m "feat(jarvis/ui): scale hologram avatar for new 120x120 mini size"
```

### Task 4: Remove Auto-Minimize Timer

**Files:**
- Modify: `JarvisUI/JarvisUI/JarvisViewModel.swift:114-116` (timer config)
- Modify: `JarvisUI/JarvisUI/JarvisViewModel.swift:152-188` (timer functions)
- Modify: `JarvisUI/JarvisUI/JarvisViewModel.swift:277-284` (auto-expand/minimize triggers)

**Step 1: Remove auto-minimize delay and timer**

In `JarvisViewModel.swift`:

```swift
// DELETE lines 114-116 (autoMinimize toggle and delay):
// private var autoMinimizeEnabled = true
// private var autoMinimizeTimer: Timer?
// private let autoMinimizeDelay: TimeInterval = 8.0

// DELETE the resetAutoMinimizeTimer() function (lines ~164-188)
// DELETE the auto-minimize trigger in processEvent (lines ~282-284)
```

**Step 2: Keep manual transitions working**

The `transitionTo()` function should still work for manual state changes (hotkey, click). Only remove the timer-based auto-minimize logic.

**Step 3: Remove auto-expand on interaction if desired**

Keep the auto-expand to ACTIVE when wake word detected (line ~277-279), but remove the auto-minimize back to mini.

**Step 4: Verify build**

```bash
cd devagents/jarvis/JarvisUI && swift build 2>&1 | tail -5
```

**Step 5: Commit**

```bash
git add JarvisUI/JarvisUI/JarvisViewModel.swift
git commit -m "feat(jarvis/ui): remove auto-minimize timer, manual close only"
```

### Task 5: Update Window Creation in AppDelegate

**Files:**
- Modify: `JarvisUI/JarvisUI/JarvisUIApp.swift:163` (initial frame)
- Modify: `JarvisUI/JarvisUI/JarvisUIApp.swift:315-317` (settings auto-minimize toggle)

**Step 1: Update initial window frame**

```swift
// OLD (line 163): window.setFrame(NSRect(x: 100, y: 100, width: 60, height: 60), ...)
// NEW: window.setFrame(NSRect(x: 100, y: 100, width: 120, height: 120), ...)
```

**Step 2: Remove auto-minimize toggle from Settings**

Remove the `autoMinimize` toggle from the settings view (around line 317).

**Step 3: Verify build**

```bash
cd devagents/jarvis/JarvisUI && swift build 2>&1 | tail -5
```

**Step 4: Commit**

```bash
git add JarvisUI/JarvisUI/JarvisUIApp.swift
git commit -m "feat(jarvis/ui): update window frame to 120x120, remove auto-minimize setting"
```

### Task 6: ChatGPT-Style Message Bubbles

**Files:**
- Modify: `JarvisUI/JarvisUI/AvatarWindowView.swift:493-555` (TranscriptBubbleView)
- Modify: `JarvisUI/JarvisUI/AvatarWindowView.swift:557-621` (ToolResultBubbleView)
- Modify: `JarvisUI/JarvisUI/AvatarWindowView.swift:623-650` (ErrorBubbleView)

**Step 1: Redesign TranscriptBubbleView**

Replace the current bubble implementation with ChatGPT-style:

```swift
struct TranscriptBubbleView: View {
    let message: ConversationMessage

    var isUser: Bool { message.role == "user" }

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 40) }

            Text(message.text)
                .font(.system(size: 17))  // was 12
                .lineSpacing(6)            // was default (~1.2)
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 16)  // was 10
                        .fill(isUser
                            ? LinearGradient(colors: [Color.blue, Color.purple], startPoint: .topLeading, endPoint: .bottomTrailing)
                            : LinearGradient(colors: [Color(white: 0.2), Color(white: 0.25)], startPoint: .topLeading, endPoint: .bottomTrailing)
                        )
                )
                .frame(maxWidth: .infinity * 0.85, alignment: isUser ? .trailing : .leading)

            if !isUser { Spacer(minLength: 40) }
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 4)
    }
}
```

**Step 2: Update ToolResultBubbleView font**

```swift
// Change font size from default small to .callout (13pt)
// Change line limit from 8 to 12
.font(.system(size: 13, design: .monospaced))
.lineLimit(12)
```

**Step 3: Update ErrorBubbleView font**

```swift
// OLD (line 633): .font(.system(size: 11))
// NEW: .font(.system(size: 14))
```

**Step 4: Verify build**

```bash
cd devagents/jarvis/JarvisUI && swift build 2>&1 | tail -5
```

**Step 5: Commit**

```bash
git add JarvisUI/JarvisUI/AvatarWindowView.swift
git commit -m "feat(jarvis/ui): ChatGPT-style bubbles, larger fonts, better spacing"
```

### Task 7: Update Header and Footer Fonts

**Files:**
- Modify: `JarvisUI/JarvisUI/AvatarWindowView.swift:246-356` (header + footer)
- Modify: `JarvisUI/JarvisUI/AvatarWindowView.swift:358-452` (transcript area)

**Step 1: Update ActiveHeaderView fonts**

```swift
// OLD (line 269): .font(.system(size: 14, ...))  "J.A.R.V.I.S"
// NEW: .font(.system(size: 18, ...))

// OLD (line 283): .font(.system(size: 9))  state badge
// NEW: .font(.system(size: 12))
```

**Step 2: Update ActiveFooterView fonts**

```swift
// OLD (line 328): .font(.system(size: 8))  "Temizle" button
// NEW: .font(.system(size: 12))
```

**Step 3: Update TranscriptAreaView**

```swift
// OLD (line 450): .frame(maxHeight: 200)
// NEW: .frame(maxHeight: 400)  // more room in 500x700 window

// Update idle message font (around line 371-376):
// OLD: .font(.caption)
// NEW: .font(.callout)
```

**Step 4: Add close button to header**

Add an "X" button to the ActiveHeaderView that transitions to mini state:

```swift
Button(action: { viewModel.transitionTo(.mini) }) {
    Image(systemName: "xmark.circle.fill")
        .font(.system(size: 18))
        .foregroundColor(.gray.opacity(0.6))
}
.buttonStyle(.plain)
```

**Step 5: Verify build**

```bash
cd devagents/jarvis/JarvisUI && swift build 2>&1 | tail -5
```

**Step 6: Commit**

```bash
git add JarvisUI/JarvisUI/AvatarWindowView.swift
git commit -m "feat(jarvis/ui): larger header/footer fonts, close button, expanded transcript area"
```

### Task 8: Update MiniAvatarView for 120x120

**Files:**
- Modify: `JarvisUI/JarvisUI/AvatarWindowView.swift:56-153` (MiniAvatarView)

**Step 1: Scale mini avatar elements**

```swift
// OLD (line 96): Ring size 50x50
// NEW: Ring size 100x100

// OLD (line 120): J icon font size 22
// NEW: J icon font size 36

// Connection indicator dot should also scale:
// OLD: 8x8 circle
// NEW: 12x12 circle
```

**Step 2: Verify build and commit**

```bash
cd devagents/jarvis/JarvisUI && swift build 2>&1 | tail -5
git add JarvisUI/JarvisUI/AvatarWindowView.swift
git commit -m "feat(jarvis/ui): scale mini avatar elements for 120x120 size"
```

---

## Phase 2: Kumru LLM (MLX-first + Piri RAG)

### Task 9: Update Python Dependencies

**Files:**
- Modify: `requirements.txt`

**Step 1: Add new dependencies**

Add to requirements.txt:

```
requests>=2.31.0
beautifulsoup4>=4.12.0
```

Note: `mlx-lm` is installed separately in `services/mlx-llm/.venv` to avoid conflicts.

**Step 2: Install**

```bash
cd devagents/jarvis && pip install -r requirements.txt
```

**Step 3: Commit**

```bash
git add requirements.txt
git commit -m "feat(jarvis): add web scraping dependencies"
```

### Task 10: Create kumru_client.py (MLX-first)

**Files:**
- Create: `core/kumru_client.py`

**Step 1: Write the Kumru LLM client with MLX-first backend detection**

```python
"""
Kumru LLM Client - MLX-first + Piri RAG bridge.

Kumru = MLX-LM inference (Apple Silicon) + Piri RAG engine, unified as AKIS's LLM.
Backend priority: MLX Gateway (port 11435) → Ollama (port 11434) → Cloud API.
All backends use OpenAI-compatible /v1/chat/completions format.
"""

import os
import json
import time
import logging
import requests
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any

logger = logging.getLogger("kumru")


@dataclass
class KumruResult:
    """Result from Kumru LLM query."""
    answer: str
    thinking: str = ""
    model: str = ""
    backend: str = ""  # "mlx", "ollama", or "api"
    rag_context: str = ""
    latency_ms: int = 0
    tools_called: List[str] = field(default_factory=list)


class KumruClient:
    """
    Kumru LLM: MLX-first inference + Piri RAG.

    Flow:
    1. Query Piri RAG for relevant knowledge context
    2. Send query + context to best available backend
    3. Parse result including thinking and tool calls

    Backend priority: MLX → Ollama → Cloud API
    """

    def __init__(self):
        self.backend = os.getenv("JARVIS_BACKEND", "mlx")  # "mlx", "ollama", "api"

        # MLX config (primary)
        self.mlx_url = os.getenv("MLX_URL", "http://127.0.0.1:11435")
        self.mlx_model = os.getenv("MLX_MODEL", "mlx-community/Qwen3-4B-Instruct-2507-4bit")

        # Ollama config (fallback)
        self.ollama_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
        self.ollama_model = os.getenv("JARVIS_MODEL", "gpt-oss:20b")

        # Cloud API config
        self.api_key = os.getenv("JARVIS_API_KEY", "")
        self.api_provider = os.getenv("JARVIS_API_PROVIDER", "openai")
        self.api_model = os.getenv("JARVIS_API_MODEL", "gpt-4o-mini")

        # Piri RAG config
        self.piri_url = os.getenv("PIRI_URL", "http://127.0.0.1:8000")
        self.piri_enabled = os.getenv("PIRI_ENABLED", "true").lower() == "true"

        # Thinking mode
        self.thinking_mode = os.getenv("JARVIS_THINKING", "high")

        # API endpoints by provider
        self.api_endpoints = {
            "openai": "https://api.openai.com/v1/chat/completions",
            "openrouter": "https://openrouter.ai/api/v1/chat/completions",
        }

        logger.info(f"Kumru initialized: backend={self.backend}, "
                     f"mlx_model={self.mlx_model}, thinking={self.thinking_mode}")

    def _detect_backend(self) -> str:
        """Auto-detect best available backend. MLX → Ollama → API."""
        if self.backend == "api" and self.api_key:
            return "api"

        # Try MLX first
        try:
            r = requests.get(f"{self.mlx_url}/health", timeout=3)
            if r.status_code == 200:
                return "mlx"
        except:
            pass

        # Try Ollama
        try:
            r = requests.get(f"{self.ollama_url}/api/tags", timeout=3)
            if r.status_code == 200:
                return "ollama"
        except:
            pass

        # Fall back to API if key exists
        if self.api_key:
            return "api"

        return "mlx"  # default, will fail with clear error

    def query_piri_rag(self, question: str) -> str:
        """Query Piri RAG engine for relevant context."""
        if not self.piri_enabled:
            return ""
        try:
            resp = requests.post(
                f"{self.piri_url}/ask",
                json={"question": question},
                timeout=10
            )
            if resp.status_code == 200:
                data = resp.json()
                return data.get("context", data.get("answer", ""))
        except Exception as e:
            logger.warning(f"Piri RAG unavailable: {e}")
        return ""

    def _build_system_prompt(self, rag_context: str = "", user_profile: dict = None) -> str:
        """Build system prompt with RAG context and user profile."""
        base = (
            "Sen Jarvis, AKIS platformunun sesli asistanısın. "
            "Türkçe konuş, kısa ve öz cevaplar ver.\n"
            f"Reasoning: {self.thinking_mode}\n"
        )

        if user_profile:
            name = user_profile.get("name", "")
            prefs = user_profile.get("preferences", {})
            habits = user_profile.get("habits", {})
            if name:
                base += f"\nKullanıcı: {name}"
            if prefs:
                base += f"\nTercihler: {json.dumps(prefs, ensure_ascii=False)}"
            if habits:
                base += f"\nAlışkanlıklar: {json.dumps(habits, ensure_ascii=False)}"

        if rag_context:
            base += f"\n\nBilgi tabanından alınan bağlam:\n{rag_context}"

        base += (
            "\n\nCevap formatı:\n"
            "SPEAK: <tek cümle sesli yanıt>\n"
            "DISPLAY: <detaylı metin>\n"
            "TOOL: <json tool çağrısı>"
        )
        return base

    def _query_openai_compat(self, url: str, model: str, messages: List[Dict],
                              headers: Dict = None, tools: List[Dict] = None) -> dict:
        """Send request to any OpenAI-compatible endpoint (MLX, Ollama, Cloud)."""
        if headers is None:
            headers = {"Content-Type": "application/json"}

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 1024,
        }
        if tools:
            payload["tools"] = tools

        resp = requests.post(f"{url}/v1/chat/completions",
                             headers=headers, json=payload, timeout=120)
        resp.raise_for_status()
        return resp.json()

    def query(
        self,
        question: str,
        conversation_history: List[Dict] = None,
        tools: List[Dict] = None,
        user_profile: dict = None,
    ) -> KumruResult:
        """
        Main query method.
        1. Query Piri RAG for context
        2. Auto-detect backend (MLX → Ollama → API)
        3. Send to best available backend
        4. Parse result including thinking and tool calls
        """
        start = time.time()

        # Step 1: Get RAG context from Piri
        rag_context = self.query_piri_rag(question)

        # Step 2: Build messages
        system_prompt = self._build_system_prompt(rag_context, user_profile)
        messages = [{"role": "system", "content": system_prompt}]
        if conversation_history:
            messages.extend(conversation_history[-10:])
        messages.append({"role": "user", "content": question})

        # Step 3: Detect backend and query
        active_backend = self._detect_backend()
        logger.info(f"Using backend: {active_backend}")

        try:
            if active_backend == "mlx":
                raw = self._query_openai_compat(
                    self.mlx_url, self.mlx_model, messages, tools=tools)
            elif active_backend == "ollama":
                raw = self._query_openai_compat(
                    self.ollama_url, self.ollama_model, messages, tools=tools)
            else:  # api
                endpoint = self.api_endpoints.get(
                    self.api_provider, self.api_endpoints["openai"])
                # Remove /v1/chat/completions since _query_openai_compat adds it
                base = endpoint.replace("/v1/chat/completions", "")
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                raw = self._query_openai_compat(
                    base, self.api_model, messages, headers=headers, tools=tools)
        except Exception as e:
            logger.error(f"Kumru query failed ({active_backend}): {e}")
            return KumruResult(
                answer=f"Üzgünüm, bir hata oluştu: {e}",
                model="",
                backend=active_backend,
                latency_ms=int((time.time() - start) * 1000)
            )

        # Step 4: Parse OpenAI-format response
        latency = int((time.time() - start) * 1000)
        answer = ""
        thinking = ""
        tools_called = []
        model_used = ""

        choices = raw.get("choices", [{}])
        if choices:
            msg = choices[0].get("message", {})
            answer = msg.get("content", "")
            model_used = raw.get("model", "")

            # Extract thinking from <think> tags
            if answer and "<think>" in answer and "</think>" in answer:
                think_start = answer.index("<think>") + 7
                think_end = answer.index("</think>")
                thinking = answer[think_start:think_end].strip()
                answer = answer[think_end + 8:].strip()

            # Handle tool calls
            if msg.get("tool_calls"):
                for tc in msg["tool_calls"]:
                    tools_called.append(tc.get("function", {}).get("name", ""))

        return KumruResult(
            answer=answer,
            thinking=thinking,
            model=model_used,
            backend=active_backend,
            rag_context=rag_context[:200] if rag_context else "",
            latency_ms=latency,
            tools_called=tools_called,
        )

    def health_check(self) -> dict:
        """Check all Kumru components."""
        status = {"kumru": True, "mlx": False, "ollama": False, "api": False, "piri": False}

        # Check MLX Gateway
        try:
            r = requests.get(f"{self.mlx_url}/health", timeout=3)
            status["mlx"] = r.status_code == 200
        except:
            pass

        # Check Ollama
        try:
            r = requests.get(f"{self.ollama_url}/api/tags", timeout=3)
            status["ollama"] = r.status_code == 200
        except:
            pass

        # Check API
        status["api"] = bool(self.api_key)

        # Check Piri
        try:
            if self.piri_enabled:
                r = requests.get(f"{self.piri_url}/health", timeout=3)
                status["piri"] = r.status_code == 200
        except:
            pass

        status["active_backend"] = self._detect_backend()
        return status
```

**Step 2: Verify syntax**

```bash
cd devagents/jarvis && python -c "from core.kumru_client import KumruClient; print('OK')"
```

Expected: OK

**Step 3: Commit**

```bash
git add core/kumru_client.py
git commit -m "feat(jarvis): add Kumru LLM client - MLX-first + Piri RAG bridge"
```

### Task 11: Update llm_client.py to Use Kumru

**Files:**
- Modify: `core/llm_client.py:18-21` (model config)
- Modify: `core/llm_client.py:141-245` (query functions)

**Step 1: Replace direct Ollama calls with Kumru**

At the top of llm_client.py, add Kumru import and initialization:

```python
# Add after existing imports:
from core.kumru_client import KumruClient

# Replace OLLAMA_URL/MODEL constants (lines 18-21):
kumru = KumruClient()
```

**Step 2: Update query_with_routing() to delegate to Kumru**

The main `query_with_routing()` function (line ~147) should delegate complex queries to Kumru while keeping simple routing intact:

```python
def query_with_routing(text, profile="balanced", context=None):
    """Route query through Kumru LLM."""
    start = time.time()

    result = kumru.query(
        question=text,
        conversation_history=context,
    )

    return QueryResult(
        text=result.answer,
        model_name=result.model,
        source="local" if result.mode == "local" else "cloud",
        profile=profile,
        latency_ms=result.latency_ms,
    )
```

**Step 3: Update health_check()**

```python
def health_check():
    return kumru.health_check()
```

**Step 4: Verify**

```bash
cd devagents/jarvis && python -c "from core.llm_client import health_check; print(health_check())"
```

**Step 5: Commit**

```bash
git add core/llm_client.py
git commit -m "feat(jarvis): wire llm_client to Kumru LLM backend"
```

### Task 12: Update .env and Config for MLX-first

**Files:**
- Modify: `.env`
- Modify: `config/settings.env:25-28`

**Step 1: Update .env**

```env
# Kumru LLM Configuration (MLX-first)
JARVIS_BACKEND=mlx           # "mlx", "ollama", or "api"
JARVIS_THINKING=high

# MLX-LM Gateway (Primary - Apple Silicon)
MLX_URL=http://127.0.0.1:11435
MLX_MODEL=mlx-community/Qwen3-4B-Instruct-2507-4bit

# Ollama (Fallback)
OLLAMA_BASE_URL=http://127.0.0.1:11434
JARVIS_MODEL=gpt-oss:20b

# Piri RAG
PIRI_URL=http://127.0.0.1:8000
PIRI_ENABLED=true

# Cloud API (optional - user provides their own key)
# JARVIS_API_KEY=sk-...
# JARVIS_API_PROVIDER=openai
# JARVIS_API_MODEL=gpt-4o-mini
```

**Step 2: Update config/settings.env**

```env
# LLM Settings
LLM_BACKEND=mlx
LLM_TIMEOUT=60
```

**Step 3: Update start_mlx_server.sh to use new MLX gateway**

The existing `services/mlx-llm/` is already the correct gateway.
Update `start_mlx_server.sh` to use it:

```bash
#!/bin/bash
# Start MLX-LM Gateway for Jarvis
cd "$(dirname "$0")/services/mlx-llm"

if [ ! -d ".venv" ]; then
    echo "Setting up MLX-LM Gateway..."
    make install
fi

source .venv/bin/activate
MLX_MODEL="${1:-mlx-community/Qwen3-4B-Instruct-2507-4bit}" \
    uvicorn server:app --host 127.0.0.1 --port 11435
```

**Step 4: Commit**

```bash
git add .env config/settings.env start_mlx_server.sh
git commit -m "feat(jarvis): configure MLX-first Kumru LLM settings"
```

### Task 13: Update hybrid_router.py for Kumru

**Files:**
- Modify: `core/hybrid_router.py:40-44` (model profiles)
- Modify: `core/hybrid_router.py:47-79` (routing config)
- Modify: `core/hybrid_router.py:128-133` (web patterns - now supported)

**Step 1: Update model profiles**

```python
# OLD (lines 40-44):
# FAST = "7b", BALANCED = "13b", QUALITY = "32b"
# NEW:
FAST = "gpt-oss:20b"      # low thinking
BALANCED = "gpt-oss:20b"  # medium thinking
QUALITY = "gpt-oss:20b"   # high thinking
```

**Step 2: Enable web queries**

Since Kumru now has web search capability, update the routing:

```python
# In RoutingConfig (line 51):
# OLD: offline_only = True
# NEW: offline_only = False  # Kumru supports web search
```

**Step 3: Update WEB category routing**

In the `route()` function (~line 282-294), WEB queries should now route to Kumru with web search tool:

```python
# WEB queries now go to Kumru (not blocked)
if category == QueryCategory.WEB:
    return RoutingDecision(
        model_source=ModelSource.LOCAL,
        model_profile=ModelProfile.BALANCED,
        reasoning="Web query - Kumru handles web search"
    )
```

**Step 4: Commit**

```bash
git add core/hybrid_router.py
git commit -m "feat(jarvis): update hybrid router for Kumru + web search support"
```

---

## Phase 3: Learning System + Web Agent

### Task 14: Create web_search.py

**Files:**
- Create: `core/web_search.py`

**Step 1: Write web search module**

```python
"""
Web search module for Jarvis.
Uses Brave Search API (free tier: 2000/month) with DuckDuckGo fallback.
"""

import os
import logging
import requests
from typing import List, Dict, Optional

logger = logging.getLogger("web_search")

BRAVE_API_KEY = os.getenv("BRAVE_API_KEY", "")
BRAVE_URL = "https://api.search.brave.com/res/v1/web/search"


def search_brave(query: str, count: int = 5) -> List[Dict]:
    """Search using Brave Search API."""
    if not BRAVE_API_KEY:
        logger.warning("Brave API key not set, falling back to DuckDuckGo")
        return search_duckduckgo(query, count)

    headers = {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_API_KEY,
    }
    params = {"q": query, "count": count}

    try:
        resp = requests.get(BRAVE_URL, headers=headers, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("web", {}).get("results", [])[:count]:
            results.append({
                "title": item.get("title", ""),
                "url": item.get("url", ""),
                "description": item.get("description", ""),
            })
        return results
    except Exception as e:
        logger.error(f"Brave search failed: {e}")
        return search_duckduckgo(query, count)


def search_duckduckgo(query: str, count: int = 5) -> List[Dict]:
    """Fallback search using DuckDuckGo HTML (no API key needed)."""
    try:
        resp = requests.get(
            "https://html.duckduckgo.com/html/",
            params={"q": query},
            headers={"User-Agent": "Jarvis/1.0"},
            timeout=10
        )
        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "html.parser")

        results = []
        for r in soup.select(".result")[:count]:
            title_el = r.select_one(".result__title a")
            snippet_el = r.select_one(".result__snippet")
            if title_el:
                results.append({
                    "title": title_el.get_text(strip=True),
                    "url": title_el.get("href", ""),
                    "description": snippet_el.get_text(strip=True) if snippet_el else "",
                })
        return results
    except Exception as e:
        logger.error(f"DuckDuckGo search failed: {e}")
        return []


def search(query: str, count: int = 5) -> List[Dict]:
    """Main search function - tries Brave, falls back to DuckDuckGo."""
    return search_brave(query, count)
```

**Step 2: Verify**

```bash
cd devagents/jarvis && python -c "from core.web_search import search; print('OK')"
```

**Step 3: Commit**

```bash
git add core/web_search.py
git commit -m "feat(jarvis): add web search module (Brave + DuckDuckGo fallback)"
```

### Task 15: Create web_scraper.py

**Files:**
- Create: `core/web_scraper.py`

**Step 1: Write web scraper module**

```python
"""
Web scraper module for Jarvis.
Reads web pages and extracts clean text content.
"""

import logging
import requests
from typing import Optional

logger = logging.getLogger("web_scraper")

MAX_CONTENT_LENGTH = 5000  # chars, to fit in context window


def fetch_page(url: str) -> Optional[str]:
    """Fetch a web page and extract clean text."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Jarvis/1.0",
        }
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()

        from bs4 import BeautifulSoup
        soup = BeautifulSoup(resp.text, "html.parser")

        # Remove scripts, styles, nav, footer
        for tag in soup(["script", "style", "nav", "footer", "header", "aside"]):
            tag.decompose()

        # Try to find main content
        main = soup.find("main") or soup.find("article") or soup.find("body")
        if not main:
            return None

        text = main.get_text(separator="\n", strip=True)

        # Truncate if too long
        if len(text) > MAX_CONTENT_LENGTH:
            text = text[:MAX_CONTENT_LENGTH] + "\n\n[... içerik kırpıldı ...]"

        return text
    except Exception as e:
        logger.error(f"Failed to fetch {url}: {e}")
        return None
```

**Step 2: Verify**

```bash
cd devagents/jarvis && python -c "from core.web_scraper import fetch_page; print('OK')"
```

**Step 3: Commit**

```bash
git add core/web_scraper.py
git commit -m "feat(jarvis): add web scraper module for page reading"
```

### Task 16: Add Web Tools to tool_executor.py

**Files:**
- Modify: `core/tool_executor.py` (add new tool handlers)

**Step 1: Add imports at top of tool_executor.py**

```python
from core.web_search import search as web_search_fn
from core.web_scraper import fetch_page
```

**Step 2: Add new tool handlers**

Add these functions and register them in the tool dispatch (around line 39-120):

```python
def tool_web_search(params: dict) -> ToolResult:
    """Search the web."""
    query = params.get("query", "")
    if not query:
        return ToolResult(success=False, output="Arama sorgusu boş.")
    results = web_search_fn(query, count=params.get("count", 5))
    if not results:
        return ToolResult(success=False, output="Sonuç bulunamadı.")
    output = "\n".join(
        f"• {r['title']}\n  {r['url']}\n  {r['description']}"
        for r in results
    )
    return ToolResult(success=True, output=output)


def tool_web_read(params: dict) -> ToolResult:
    """Read a web page."""
    url = params.get("url", "")
    if not url:
        return ToolResult(success=False, output="URL belirtilmedi.")
    content = fetch_page(url)
    if not content:
        return ToolResult(success=False, output=f"Sayfa okunamadı: {url}")
    return ToolResult(success=True, output=content)


def tool_weather(params: dict) -> ToolResult:
    """Get weather information."""
    import requests as req
    city = params.get("city", "Istanbul")
    api_key = os.getenv("OPENWEATHER_API_KEY", "")
    if not api_key:
        # Fallback: use web search
        results = web_search_fn(f"{city} hava durumu bugün", count=3)
        if results:
            return ToolResult(success=True, output=results[0].get("description", "Hava bilgisi bulunamadı"))
        return ToolResult(success=False, output="Hava durumu API anahtarı yok ve web araması başarısız.")

    url = f"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=metric&lang=tr"
    resp = req.get(url, timeout=10)
    data = resp.json()
    desc = data.get("weather", [{}])[0].get("description", "")
    temp = data.get("main", {}).get("temp", "?")
    return ToolResult(success=True, output=f"{city}: {desc}, {temp}°C")


def tool_news(params: dict) -> ToolResult:
    """Fetch current news."""
    topic = params.get("topic", "gündem")
    results = web_search_fn(f"{topic} haberleri bugün", count=5)
    if not results:
        return ToolResult(success=False, output="Haber bulunamadı.")
    output = "\n".join(f"• {r['title']}: {r['description']}" for r in results)
    return ToolResult(success=True, output=output)


def tool_translate(params: dict) -> ToolResult:
    """Translate text (delegates to LLM)."""
    text = params.get("text", "")
    target = params.get("target", "en")
    if not text:
        return ToolResult(success=False, output="Çevrilecek metin boş.")
    # This will be handled by the LLM itself via function calling
    return ToolResult(success=True, output=f"[LLM çevirecek: '{text}' → {target}]")
```

**Step 3: Register tools in the dispatch dict**

Add to the tool dispatch routing (around line 39):

```python
"web_search": tool_web_search,
"web_read": tool_web_read,
"weather": tool_weather,
"news": tool_news,
"translate": tool_translate,
```

**Step 4: Verify**

```bash
cd devagents/jarvis && python -c "from core.tool_executor import tool_web_search; print('OK')"
```

**Step 5: Commit**

```bash
git add core/tool_executor.py
git commit -m "feat(jarvis): add web_search, web_read, weather, news, translate tools"
```

### Task 17: Update config/tools.json

**Files:**
- Modify: `config/tools.json`

**Step 1: Add new tool definitions**

Add to the tools array:

```json
{
  "name": "web_search",
  "description": "İnternette arama yap",
  "parameters": {"query": "string", "count": "int"},
  "permission": "auto"
},
{
  "name": "web_read",
  "description": "Bir web sayfasını oku ve özetle",
  "parameters": {"url": "string"},
  "permission": "auto"
},
{
  "name": "weather",
  "description": "Hava durumunu sorgula",
  "parameters": {"city": "string"},
  "permission": "auto"
},
{
  "name": "news",
  "description": "Güncel haberleri getir",
  "parameters": {"topic": "string"},
  "permission": "auto"
},
{
  "name": "translate",
  "description": "Metin çevir",
  "parameters": {"text": "string", "target": "string"},
  "permission": "auto"
}
```

**Step 2: Commit**

```bash
git add config/tools.json
git commit -m "feat(jarvis): add web tool definitions to tools.json"
```

### Task 18: Enhance memory_store.py with User Profile

**Files:**
- Modify: `core/memory_store.py`

**Step 1: Add user profile management**

Add after the existing MemoryStore class (after line ~223):

```python
class UserProfileStore:
    """Manages persistent user profile for personalization."""

    def __init__(self, memory_dir: str = None):
        if memory_dir is None:
            memory_dir = os.path.join(os.path.expanduser("~"), "jarvis", "memory")
        self.profile_path = os.path.join(memory_dir, "user_profile.json")
        self.profile = self._load()

    def _load(self) -> dict:
        if os.path.exists(self.profile_path):
            with open(self.profile_path, "r") as f:
                return json.load(f)
        return {
            "name": "",
            "preferences": {"language": "tr", "tone": "casual"},
            "habits": {},
            "frequent_commands": {},
            "topics_of_interest": [],
            "correction_history": [],
        }

    def save(self):
        os.makedirs(os.path.dirname(self.profile_path), exist_ok=True)
        with open(self.profile_path, "w") as f:
            json.dump(self.profile, f, ensure_ascii=False, indent=2)

    def set_name(self, name: str):
        self.profile["name"] = name
        self.save()

    def update_preference(self, key: str, value):
        self.profile["preferences"][key] = value
        self.save()

    def record_command(self, command: str):
        """Track command frequency."""
        cmds = self.profile["frequent_commands"]
        cmds[command] = cmds.get(command, 0) + 1
        self.save()

    def record_habit(self, time_slot: str, action: str):
        """Track time-based habits."""
        habits = self.profile["habits"]
        if time_slot not in habits:
            habits[time_slot] = []
        if action not in habits[time_slot]:
            habits[time_slot].append(action)
        self.save()

    def record_correction(self, original: str, corrected: str):
        """Remember user corrections."""
        self.profile["correction_history"].append({
            "original": original,
            "corrected": corrected,
            "timestamp": time.strftime("%Y-%m-%d %H:%M")
        })
        # Keep last 50 corrections
        self.profile["correction_history"] = self.profile["correction_history"][-50:]
        self.save()

    def add_interest(self, topic: str):
        if topic not in self.profile["topics_of_interest"]:
            self.profile["topics_of_interest"].append(topic)
            self.save()

    def get_profile(self) -> dict:
        return self.profile

    def get_top_commands(self, n: int = 10) -> list:
        cmds = self.profile["frequent_commands"]
        sorted_cmds = sorted(cmds.items(), key=lambda x: x[1], reverse=True)
        return sorted_cmds[:n]
```

**Step 2: Verify**

```bash
cd devagents/jarvis && python -c "from core.memory_store import UserProfileStore; p = UserProfileStore(); print(p.get_profile())"
```

**Step 3: Commit**

```bash
git add core/memory_store.py
git commit -m "feat(jarvis): add UserProfileStore for personal learning"
```

### Task 19: Wire User Profile into Kumru

**Files:**
- Modify: `core/jarvis_daemon.py` (or main entry point)

**Step 1: Initialize UserProfileStore in daemon**

Add to the daemon initialization:

```python
from core.memory_store import UserProfileStore
from core.kumru_client import KumruClient

user_profile = UserProfileStore()
kumru = KumruClient()
```

**Step 2: Pass profile to Kumru on each query**

In the query flow, pass user profile:

```python
result = kumru.query(
    question=transcribed_text,
    conversation_history=history,
    user_profile=user_profile.get_profile(),
)
```

**Step 3: Record commands after each interaction**

After processing a command:

```python
user_profile.record_command(transcribed_text)

# Record time-based habit
from datetime import datetime
hour = datetime.now().hour
if hour < 12:
    time_slot = "morning"
elif hour < 18:
    time_slot = "afternoon"
else:
    time_slot = "evening"
user_profile.record_habit(time_slot, transcribed_text[:50])
```

**Step 4: Commit**

```bash
git add core/jarvis_daemon.py
git commit -m "feat(jarvis): wire user profile learning into daemon loop"
```

### Task 20: Final Integration Test

**Step 1: Start MLX-LM Gateway**

```bash
cd devagents/jarvis/services/mlx-llm
make install  # first time only
make run       # starts on port 11435
```

In another terminal, verify:
```bash
curl -s http://127.0.0.1:11435/health
```

Expected: `{"status": "ok", "model": "mlx-community/Qwen3-4B-Instruct-2507-4bit"}`

**Step 2: Verify Piri is running**

```bash
curl -s http://127.0.0.1:8000/health
```

**Step 3: Test Kumru health check (should show MLX active)**

```bash
cd devagents/jarvis && python -c "
from core.kumru_client import KumruClient
k = KumruClient()
status = k.health_check()
print(status)
assert status['mlx'] == True, 'MLX should be active'
print(f'Active backend: {status[\"active_backend\"]}')
"
```

Expected: `{'kumru': True, 'mlx': True, 'ollama': ..., 'api': False, 'piri': ..., 'active_backend': 'mlx'}`

**Step 4: Test a real Kumru query through MLX**

```bash
cd devagents/jarvis && python -c "
from core.kumru_client import KumruClient
k = KumruClient()
result = k.query('Merhaba, sen kimsin?')
print(f'Backend: {result.backend}')
print(f'Model: {result.model}')
print(f'Answer: {result.answer[:200]}')
print(f'Latency: {result.latency_ms}ms')
"
```

**Step 5: Test web search**

```bash
cd devagents/jarvis && python -c "
from core.web_search import search
results = search('Python programlama')
for r in results:
    print(r['title'])
"
```

**Step 6: Test user profile**

```bash
cd devagents/jarvis && python -c "
from core.memory_store import UserProfileStore
p = UserProfileStore()
p.set_name('Ömer')
p.record_command('spotify çal')
p.record_command('spotify çal')
p.record_command('hava durumu')
print(p.get_top_commands())
print(p.get_profile()['name'])
"
```

**Step 7: Final commit**

```bash
cd /Users/omeryasironal/Projects/bitirme_projesi/akis-platform-devolopment
git add -A
git commit -m "feat(jarvis): Jarvis v2 complete - Kumru LLM (MLX-first), UI fixes, web agent, learning"
```

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 0 | Task 1 | Repo migration to devagents/ |
| Phase 1 | Tasks 2-8 | UI/UX fixes (sizes, fonts, auto-minimize, ChatGPT bubbles) |
| Phase 2 | Tasks 9-13 | Kumru LLM (MLX-first + Piri RAG bridge, Ollama fallback, cloud API) |
| Phase 3 | Tasks 14-19 | Web agent + learning system |
| Final | Task 20 | Integration testing (MLX Gateway + Piri + Web + Profile) |

**Total: 20 tasks across 4 phases.**

### MLX Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Jarvis macOS App (SwiftUI)                 │
│  ├── WebSocket → voice_server.py            │
│  └── ⌥+Space hotkey, floating window       │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│  Jarvis Daemon (Python)                     │
│  ├── Wake word → STT → Intent Router        │
│  ├── Simple: regex → tool_executor          │
│  └── Complex: Kumru LLM                     │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│  Kumru Client (core/kumru_client.py)        │
│  ├── 1. Piri RAG → context retrieval        │
│  ├── 2. Auto-detect backend                 │
│  └── 3. OpenAI-compat /v1/chat/completions  │
└──┬────────────┬────────────┬────────────────┘
   │            │            │
   ▼            ▼            ▼
┌────────┐ ┌────────┐ ┌──────────┐
│ MLX-LM │ │ Ollama │ │ Cloud API│
│ :11435 │ │ :11434 │ │ (user's  │
│ Primary│ │Fallback│ │  key)    │
└────────┘ └────────┘ └──────────┘
     │
     ▼  Apple Silicon Unified Memory
┌──────────────────────────┐
│  MLX Framework           │
│  • Metal GPU + Neural E. │
│  • Prompt cache          │
│  • LoRA fine-tune ready  │
└──────────────────────────┘
```
