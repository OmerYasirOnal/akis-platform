# AKIS Product Vision: UI Test Automation & IDE

**Tarih:** 31 Ocak 2026
**Versiyon:** 0.1.0-draft

---

## 1. Ürün Vizyonu

### 1.1 İki Ana Ürün

```
┌─────────────────────────────────────────────────────────────┐
│                    AKIS ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🧪 AKIS QA Agent          💻 AKIS IDE                     │
│  ─────────────────         ────────────                    │
│  • Local LLM ile UI test   • VS Code tabanlı               │
│  • Headless browser        • Chat + Code modülleri         │
│  • CI/CD entegrasyonu      • Local AI agent desteği        │
│  • Raporlama               • macOS → Linux → Windows       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. AKIS QA Agent (UI Test Automation)

### 2.1 Konsept

Para ödemeden kendi local LLM'inle (Ollama, LM Studio, vb.) UI testleri çalıştır.

### 2.2 Özellikler

| Özellik | Açıklama |
|---------|----------|
| **Local LLM Support** | Ollama, LM Studio, llama.cpp |
| **Browser Automation** | Playwright + AI reasoning |
| **Visual Testing** | Screenshot diff, computed CSS check |
| **CI/CD Ready** | GitHub Actions, GitLab CI |
| **Report Generation** | Markdown, HTML, JSON |

### 2.3 Mimari

```
┌─────────────────────────────────────────────────────────┐
│                    AKIS QA Agent                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │
│  │ Test Spec   │ → │ AI Planner  │ → │ Browser    │  │
│  │ (YAML/MD)   │    │ (Local LLM) │    │ Executor   │  │
│  └─────────────┘    └─────────────┘    └────────────┘  │
│                            │                 │         │
│                            ▼                 ▼         │
│                     ┌─────────────┐   ┌────────────┐  │
│                     │ Assertion   │ ← │ Screenshot │  │
│                     │ Engine      │    │ + DOM      │  │
│                     └─────────────┘   └────────────┘  │
│                            │                           │
│                            ▼                           │
│                     ┌─────────────┐                    │
│                     │ Report Gen  │                    │
│                     │ (MD/HTML)   │                    │
│                     └─────────────┘                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.4 Test Spec Örneği

```yaml
# akis-qa-spec.yaml
name: "Dashboard Quality Test"
url: "http://localhost:5173/dashboard"

tests:
  - name: "Quality Card Visible"
    steps:
      - action: waitFor
        selector: "[data-testid='quality-card']"
        timeout: 5000

      - action: screenshot
        name: "dashboard_quality"

      - action: assertVisible
        selector: ".quality-score"

      - action: assertNetwork
        url: "/api/dashboard/metrics"
        status: 200

  - name: "CTA Button Styling"
    steps:
      - action: navigate
        url: "/agents"

      - action: assertComputed
        selector: "button:contains('Run Scribe')"
        css:
          background-color: "!= rgba(0,0,0,0)"
          box-shadow: "!= none"
```

### 2.5 CLI Kullanımı

```bash
# Install
npm install -g @akis/qa-agent

# Run with local Ollama
akis-qa run ./tests/ --llm ollama:llama3.2

# Run with OpenAI (fallback)
akis-qa run ./tests/ --llm openai:gpt-4o-mini

# CI mode (headless)
akis-qa run ./tests/ --ci --report html
```

### 2.6 Fiyatlandırma Modeli

| Plan | Fiyat | Özellikler |
|------|-------|------------|
| **Open Source** | Ücretsiz | Local LLM, CLI, basic reports |
| **Pro** | $29/ay | Cloud dashboard, parallel runs, Slack alerts |
| **Team** | $99/ay | CI/CD templates, priority support |
| **Enterprise** | İletişim | Custom LLM, on-prem, SLA |

---

## 3. AKIS IDE (Cursor/Antigravity Alternatifi)

### 3.1 Konsept

VS Code tabanlı, AKIS AI agentle entegre IDE.

### 3.2 Özellikler

| Özellik | Açıklama |
|---------|----------|
| **Chat Panel** | Claude/GPT/Local LLM ile sohbet |
| **Inline Completion** | AI code completion |
| **Agent Mode** | Otonom kod yazma |
| **MCP Support** | Tool calling, file access |
| **Terminal AI** | Terminal komutları için AI |

### 3.3 Teknoloji Stack

```
┌─────────────────────────────────────────────────────────┐
│                    AKIS IDE                             │
├─────────────────────────────────────────────────────────┤
│  Base: VS Code / Code OSS                               │
│  Framework: Electron                                    │
│  UI: React + Tailwind                                   │
│  AI Backend: Node.js + MCP Protocol                     │
│  Local LLM: Ollama integration                          │
│  Platform: macOS (primary) → Linux → Windows            │
└─────────────────────────────────────────────────────────┘
```

### 3.4 UI Mockup

```
┌────────────────────────────────────────────────────────────┐
│ AKIS IDE                                    ─ □ ✕         │
├────────────────────────────────────────────────────────────┤
│ File  Edit  View  Go  Run  Terminal  Help                 │
├─────────┬────────────────────────────┬─────────────────────┤
│ EXPLORER│                            │ AKIS CHAT          │
│ ─────── │  // src/App.tsx            │ ──────────         │
│ > src   │  import React from 'react' │                    │
│   App   │  import { useState } from  │ 🤖 AKIS Agent      │
│   index │                            │                    │
│ > comp  │  export function App() {   │ "Add a dark mode   │
│         │    const [count, setCount] │  toggle to the     │
│         │    return (                │  settings page"    │
│         │      <div>                 │                    │
│         │        <h1>Count: {count}  │ ────────────────   │
│         │        <button onClick=... │ [Plan] [Code] [Run]│
│         │      </div>                │                    │
│         │    )                       │ Planning...        │
│         │  }                         │ ✓ Found Settings   │
│         │                            │ ✓ Creating toggle  │
│         │                            │ ✓ Adding state     │
│         │                            │                    │
├─────────┴────────────────────────────┴─────────────────────┤
│ TERMINAL                                                   │
│ $ npm run dev                                              │
│ > vite                                                     │
│ Local: http://localhost:5173/                              │
├────────────────────────────────────────────────────────────┤
│ main ✓  Ln 12, Col 8  TypeScript React  UTF-8  LF  🤖 GPT │
└────────────────────────────────────────────────────────────┘
```

### 3.5 Yol Haritası

| Faz | Süre | Hedef |
|-----|------|-------|
| **Phase 1** | 2 ay | VS Code fork + basic chat panel |
| **Phase 2** | 2 ay | MCP integration + local LLM |
| **Phase 3** | 2 ay | Agent mode + inline completion |
| **Phase 4** | 2 ay | Polish + beta release (macOS) |
| **Phase 5** | 1 ay | Linux support |
| **Phase 6** | 1 ay | Windows support |

### 3.6 Fiyatlandırma

| Plan | Fiyat | Özellikler |
|------|-------|------------|
| **Free** | $0 | Local LLM only, basic features |
| **Pro** | $20/ay | Cloud AI, all features, updates |
| **Team** | $15/user/ay | Shared context, team features |

---

## 4. MVP Roadmap

### 4.1 AKIS QA Agent MVP (4 hafta)

| Hafta | Görev |
|-------|-------|
| 1 | Playwright + test spec parser |
| 2 | Local LLM integration (Ollama) |
| 3 | Assertion engine + reporting |
| 4 | CLI polish + npm publish |

### 4.2 AKIS IDE MVP (8 hafta)

| Hafta | Görev |
|-------|-------|
| 1-2 | VS Code fork + build system |
| 3-4 | Chat panel extension |
| 5-6 | MCP protocol integration |
| 7-8 | Local LLM + polish |

---

## 5. Rekabet Analizi

| Ürün | Fiyat | Local LLM | Open Source |
|------|-------|-----------|-------------|
| Cursor | $20/ay | ❌ | ❌ |
| Windsurf | $15/ay | ❌ | ❌ |
| Continue | Free | ✅ | ✅ |
| **AKIS IDE** | $0-20/ay | ✅ | Partial ✅ |

**Fark:** Local LLM first + AKIS agent ecosystem entegrasyonu

---

## 6. Sonraki Adımlar

1. [ ] AKIS QA Agent spec finalize
2. [ ] VS Code fork PoC başlat
3. [ ] Landing page + waitlist
4. [ ] GitHub repo setup
5. [ ] First alpha release

---

*Bu döküman AKIS ürün vizyonunun taslağıdır.*
