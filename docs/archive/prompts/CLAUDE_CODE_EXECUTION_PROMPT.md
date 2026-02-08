# AKIS — Claude Code Execution Prompt

Action-only guide for autonomous Claude Code sessions on `feat/agents-hub-observability`.

## Phase 1: Reproduce

```bash
# Start DB
./scripts/db-up.sh

# Install deps
pnpm -C frontend install
pnpm -C backend install

# Verify current state
pnpm -C backend typecheck
pnpm -C frontend build
```

Record any errors verbatim.

## Phase 2: Fix Known Issues

| Issue | File(s) | Fix |
|-------|---------|-----|
| `??` and `\|\|` mixed without parens | RunSummaryPanel.tsx | Wrap nullish-coalesce chains in explicit `()` |
| `ButtonSize` missing 'sm' | Button.tsx | Add `'sm'` to union + sizeClasses record |
| Fastify `request.routerPath` deprecated | server.app.ts | Use `(request as any).routeOptions?.url ?? (request as any).routerPath` |
| Polling log spam | server.app.ts | Add high-freq routes to `QUIET_ROUTES` set |
| esbuild ENOENT (broken artifacts) | backend node_modules | `rm -rf node_modules/.cache && pnpm install` |

## Phase 3: Sweep

```bash
# Backend
pnpm -C backend typecheck
pnpm -C backend lint
pnpm -C backend test:unit

# Frontend
pnpm -C frontend typecheck
pnpm -C frontend build
pnpm -C frontend lint
```

Fix all failures. Do not disable lint rules unless justified.

## Phase 4: UI Theme Tweak

- Check `frontend/src/theme/theme.tokens.css` for pure-white (`#FFFFFF`) surface tokens.
- Replace with off-white (e.g. `#F9FBFC`) for light theme surfaces.
- Verify all `bg-white` in components use alpha transparency (`bg-white/[0.0x]`).
- No changes to dark theme (already `#0A1215` bg).

## Phase 5: Commit

```bash
git add -A
git commit -m "fix(build): resolve TS errors, deprecations, and theme polish

- Fix RunSummaryPanel operator precedence (TS5076)
- Add 'sm' ButtonSize variant
- Replace deprecated request.routerPath with routeOptions.url
- Soften light-theme surface token to off-white

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

## Settings Maintenance

| File | Purpose | Checked In? |
|------|---------|-------------|
| `.claude/settings.json` | Project baseline (deny secrets) | Yes |
| `.claude/settings.local.json` | Local permissions (pnpm, git, tsc) | No (gitignored) |
| `.claude/CLAUDE.md` | Project memory (arch, commands, guardrails) | Yes |

## Final Output Requirements

After each session, produce:

1. **Files changed** — list with short description
2. **Commands run** — each with success/failure status
3. **Before/after summary** — per issue fixed
4. **UI theme summary** — what tokens changed
5. **Agent summary** — new agents + model config location
