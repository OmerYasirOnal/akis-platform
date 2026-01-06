# Scribe Single-Page Console UX Specification

**Version:** 1.0  
**Date:** 2026-01-06  
**Status:** Implemented (demo-ready)

---

## 1. Overview

The Scribe Console is a single-page workspace for configuring and running the Scribe documentation agent. It replaces the previous multi-step wizard approach with an integrated configuration + monitoring experience.

### Key Principles
- **Single destination**: All Scribe configuration and execution happens at `/dashboard/scribe`
- **Glass Box visibility**: Real-time insight into agent execution status, logs, and outputs
- **Demo-first**: Works without backend connection using deterministic simulation
- **No navigation required**: Configure, run, and review results without leaving the page

---

## 2. Layout

### Desktop (≥1024px)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Header: "Scribe Console" + Demo Mode badge (if applicable)                │
├─────────────────────────┬───────────────────────────────────────────────────┤
│                         │                                                   │
│   Configuration         │   Glass Box Console                               │
│   (Left Panel)          │   (Right Panel)                                   │
│                         │                                                   │
│   ┌─────────────────┐   │   ┌─────────────────────────────────────────────┐ │
│   │ Owner Select    │   │   │ [Logs] [Preview] [Diff]  ●●● repo/name     │ │
│   ├─────────────────┤   │   ├─────────────────────────────────────────────┤ │
│   │ Repository      │   │   │                                             │ │
│   ├─────────────────┤   │   │   Console output / Preview / Diff           │ │
│   │ Branch          │   │   │                                             │ │
│   ├─────────────────┤   │   │   (scrollable, monospace font for logs)     │ │
│   │ ▼ Advanced      │   │   │                                             │ │
│   │   Target Path   │   │   │                                             │ │
│   │   [ ] Dry Run   │   │   │                                             │ │
│   └─────────────────┘   │   │                                             │ │
│                         │   └─────────────────────────────────────────────┘ │
│   ┌─────────────────┐   │                                                   │
│   │ 🚀 Run Scribe   │   │   Status Summary Card                             │
│   └─────────────────┘   │   (appears during/after run)                      │
│                         │                                                   │
│   Status Summary        │                                                   │
│   (Progress bar)        │                                                   │
│                         │                                                   │
├─────────────────────────┴───────────────────────────────────────────────────┤
```

### Mobile (<1024px)
- Stacked layout: Configuration panel above Glass Box panel
- Both panels visible without horizontal scrolling
- Glass Box reduced height (~400px)

---

## 3. Configuration Panel

### Required Fields
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Owner | SearchableSelect | First available | GitHub org/user |
| Repository | SearchableSelect | First in owner | Repository name |
| Branch | SearchableSelect | `main` | Base branch for docs |

### Advanced Options (Collapsed by default)
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| Target Path | Text Input | `docs/` | Path to documentation folder |
| Dry Run | Checkbox | ✓ Checked | Preview only, no commits |

### Field Behaviors
- **Owner**: Populates from GitHub API; falls back to mock data if not connected
- **Repository**: Populates when Owner is selected
- **Branch**: Populates when Repository is selected; allows manual input override
- **All fields disabled during run**: Prevents configuration changes mid-execution

---

## 4. Glass Box Console Panel

### Tabs
1. **Logs (📋)**: Streaming execution log with timestamps
   - Monospace font, dark background
   - Auto-scrolls to latest entry
   - Color-coded by level: info (gray), success (green), error (red), warning (yellow)

2. **Preview (📄)**: Markdown preview of generated documentation
   - Updates progressively during execution
   - Shows final output when complete

3. **Diff (📝)**: Unified diff showing changes
   - Populated during finalizing step
   - Green/red line coloring for additions/deletions

### Status Indicator
- Pulsing dot: Running (teal)
- Solid dot: Complete (green)
- No dot: Idle (gray)
- Context display: `owner/repo` shown in header

---

## 5. Run States & Transitions

```
┌──────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ IDLE │───>│ SCANNING │───>│ANALYZING │───>│ DRAFTING │
└──────┘    └──────────┘    └──────────┘    └──────────┘
                                                  │
                                                  ▼
┌──────────┐    ┌───────────┐    ┌───────────┐
│ COMPLETE │<───│FINALIZING │<───│ REVIEWING │
└──────────┘    └───────────┘    └───────────┘
```

### State-specific UI
| State | Primary Button | Progress Bar | Logs Tab |
|-------|---------------|--------------|----------|
| Idle | 🚀 Run Scribe | Hidden | Empty state |
| Scanning | ⏹ Cancel | 15%, animating | Streaming |
| Analyzing | ⏹ Cancel | 35%, animating | Streaming |
| Drafting | ⏹ Cancel | 55%, animating | Streaming |
| Reviewing | ⏹ Cancel | 75%, animating | Streaming |
| Finalizing | ⏹ Cancel | 90%, animating | Streaming |
| Complete | ↺ Reset | 100%, green | Final logs |
| Cancelled | ↺ Reset | Frozen, red | Last logs |

---

## 6. Demo Mode Behavior

When GitHub is not connected or API fails:
1. Banner displays: "Demo mode: Using mock repositories"
2. Mock owners/repos/branches provided for selection
3. Run executes using `DemoScribeRunner` simulator
4. Logs, preview, and diff are deterministic simulation data

### Demo Runner Timing
- Total run duration: ~10-12 seconds
- Step logs appear with 400ms intervals
- Preview updates at each major step
- Diff appears during finalizing step

---

## 7. Fallback Behavior

| Scenario | Behavior |
|----------|----------|
| GitHub not connected | Use mock data, show demo badge |
| API timeout | Fallback to mock, show notice |
| User cancels | Stop timers, show cancelled state |
| Error during run | Show error state, allow reset |

---

## 8. Accessibility

- All form controls have visible labels
- Focus management: Tab through configuration fields
- Screen reader: Status changes announced via live region
- Keyboard: Enter to submit, Escape to cancel (where applicable)
- Color contrast: All text meets WCAG AA

---

## 9. Acceptance Criteria

### Demo-Ready Checklist
- [ ] Page loads at `/dashboard/scribe` without errors
- [ ] Configuration fields populate (mock or real data)
- [ ] "Run Scribe" button is disabled until repo/branch selected
- [ ] Clicking Run starts visible log streaming
- [ ] Preview tab shows evolving content during run
- [ ] Diff tab shows changes after finalizing step
- [ ] Cancel stops execution immediately
- [ ] Reset clears all state for new run
- [ ] No console errors during full run cycle

---

## 10. Related Routes

| Route | Behavior |
|-------|----------|
| `/dashboard/scribe` | Canonical Scribe console |
| `/dashboard/agents` | Redirects to `/dashboard/scribe` |
| `/dashboard/agents/scribe` | Redirects to `/dashboard/scribe` |
| `/dashboard/agents/scribe/run` | Redirects to `/dashboard/scribe` |
| `/dashboard/jobs/new` | Redirects to `/dashboard/scribe` |

---

## 11. Future Enhancements (Out of Scope)

- Backend integration for real Scribe execution
- Persistent job history in console
- Multiple concurrent runs
- Model selection dropdown
- Cost estimation before run

