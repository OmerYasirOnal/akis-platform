# QA Notes: Scribe Single-Page Console Demo

**Date:** 2026-01-06  
**Branch:** `feat/scribe-single-page-console-demo`  
**Tester:** AI (Cursor)

---

## 1. Demo Verification Checklist

### Page Load
- [ ] Login with valid credentials
- [ ] Navigate to `/dashboard/scribe`
- [ ] Page loads without console errors
- [ ] Header shows "Scribe Console"
- [ ] Demo Mode badge visible if GitHub not connected

### Configuration Panel
- [ ] Owner dropdown populated (mock or real data)
- [ ] Selecting owner populates Repository dropdown
- [ ] Selecting repository populates Branch dropdown
- [ ] Branch dropdown allows manual input override
- [ ] Advanced Options section collapses/expands
- [ ] Target Path input works
- [ ] Dry Run checkbox toggles

### SearchableSelect Components
- [ ] Dropdowns have liquid glass effect (blur + translucent)
- [ ] Search filtering works
- [ ] Keyboard navigation (up/down arrows) works
- [ ] Selected option shows checkmark
- [ ] Options have proper contrast on dark background

### GitHub Connected vs Not Connected

#### When GitHub Connected
- [ ] Real owners appear in dropdown
- [ ] Real repos load for selected owner
- [ ] Real branches load for selected repo
- [ ] No "Demo Mode" badge shown

#### When GitHub Not Connected
- [ ] Fallback to mock data
- [ ] "Demo Mode" badge visible
- [ ] Notice text explains demo mode
- [ ] All features still functional with mock data

### Run Scribe Flow
- [ ] "Run Scribe" button disabled until repo/branch selected
- [ ] Clicking "Run Scribe" starts execution
- [ ] Button changes to "Cancel Run" during execution
- [ ] Log tab shows streaming log entries
- [ ] Log entries appear with timestamps
- [ ] Progress bar updates during execution
- [ ] Status text updates (Scanning → Analyzing → ... → Complete)

### Glass Box Console
- [ ] Logs tab auto-scrolls to latest entry
- [ ] Preview tab shows evolving content during run
- [ ] Preview tab shows final documentation at complete
- [ ] Diff tab shows unified diff format
- [ ] Diff has color coding (green/red lines)
- [ ] Tab switching works during run

### Cancel & Reset
- [ ] Cancel button stops execution immediately
- [ ] Cancel shows "Cancelled" status
- [ ] Reset button clears all state
- [ ] After reset, can start new run

### Edge Cases
- [ ] Rapid cancel/reset doesn't cause glitches
- [ ] Switching tabs during run is smooth
- [ ] Multiple runs in sequence work correctly
- [ ] No timer leaks after cancel/reset/complete

---

## 2. Build & Test Evidence

### Frontend Tests

```bash
cd frontend && pnpm test
```

**Results:** (to be filled after running)
- Total tests: 
- Passed: 
- Failed: 
- Skipped: 

### Frontend Build

```bash
cd frontend && pnpm build
```

**Results:** (to be filled after running)
- Build success: Yes/No
- Bundle size: 
- Build time: 

### Lint Check

```bash
cd frontend && pnpm lint
```

**Results:** (to be filled after running)
- Errors: 
- Warnings: 

### TypeScript Check

```bash
cd frontend && pnpm typecheck
```

**Results:** (to be filled after running)
- Errors: 

---

## 3. Visual Inspection Notes

### SearchableSelect Dropdown Glass Effect
- Background: Should have ~95% opacity dark teal (#0D171B)
- Blur: 20px backdrop-filter blur
- Border: Subtle ak-border with 60% opacity
- Shadow: Outer shadow + subtle inner highlight

### Console Panel
- Logs: Monospace font, dark background
- Color coding: 
  - Info: gray (#A9B6BB)
  - Success: green (#10B981)
  - Error: red (#EF4444)
  - Warning: yellow (#F59E0B)

---

## 4. Known Limitations

1. **Demo Mode Only**: Backend Scribe execution not wired
2. **No Persistence**: Run history not saved between sessions
3. **Single Run**: Only one demo run at a time
4. **Fixed Mock Data**: Same mock repos for all users in demo mode

---

## 5. Fixes Applied During Testing

(Document any fixes made during QA)

| Issue | Fix | File |
|-------|-----|------|
| - | - | - |

---

## 6. Sign-Off

- [ ] All critical tests pass
- [ ] No blocking issues found
- [ ] Demo path works end-to-end
- [ ] Ready for PR review

