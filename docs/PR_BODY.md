# refactor(structure): feature-sliced layout + GitHub SSOT + 100% @/lib/ elimination

## 📋 Summary & Motivation

This PR implements a **comprehensive structural refactor** of the AKIS Platform codebase, addressing three critical goals:

1. **Feature-Sliced Architecture**: Migrate from flat `lib/` structure to domain-organized `modules/` + `shared/`
2. **GitHub SSOT Consolidation**: Centralize all GitHub installation token logic into a single source of truth
3. **Import Hygiene**: Eliminate all `@/lib/` imports (100%) in favor of `@/modules/*` and `@/shared/*`

### Why This Matters

**Before**:
- 43 `@/lib/` imports scattered across codebase
- Duplicate GitHub auth implementations (3 locations)
- No clear module boundaries (everything in `lib/`)
- Direct token creation outside provider (security risk)

**After**:
- ✅ 0 `@/lib/` imports (100% elimination)
- ✅ Single Source of Truth: `modules/github/token-provider.ts`
- ✅ Clear boundaries: `modules/` (features) + `shared/` (utilities)
- ✅ All GitHub calls use SSOT with 5-min token caching

---

## 🗂️ Before/After Tree

### BEFORE (Flat Structure)
```
src/
├── lib/
│   ├── agents/                # Documentation agents
│   ├── ai/                    # AI models (OpenRouter)
│   ├── auth/                  # Auth utilities + GitHub App
│   ├── contracts/             # API contracts
│   ├── github/                # GitHub client/operations (DUPLICATE)
│   ├── services/              # MCP service
│   └── utils/                 # Logger, diagnostic
├── components/                # All UI components (flat)
└── app/                       # Next.js routes
```

### AFTER (Feature-Sliced)
```
src/
├── modules/
│   ├── documentation/
│   │   ├── agent/             # Documentation agents + types
│   │   ├── playbooks/         # Agent playbooks
│   │   └── components/        # Feature-specific UI
│   ├── agents/scribe/
│   │   ├── client/            # Client-side runner
│   │   └── server/            # Server-side runner
│   └── github/                # ✅ SSOT for GitHub
│       ├── token-provider.ts  # ✅ SSOT (JWT, caching, env)
│       ├── client.ts          # Unified GitHub client
│       └── operations.ts      # GitHub operations
├── shared/
│   ├── components/
│   │   ├── ai/                # Model selector
│   │   ├── github/            # GitHub UI components
│   │   └── integrations/      # Integration UI
│   ├── lib/
│   │   ├── ai/                # AI models, usage tracking
│   │   ├── auth/              # Actor, storage
│   │   └── utils/             # Logger, diagnostic
│   ├── services/              # MCP service
│   └── types/                 # Global types, contracts
└── app/                       # Next.js routes (unchanged)
```

---

## 📦 Move Map & Deletions

### Files Moved (PHASE 2)
**35 files moved** from `lib/` to `modules/` or `shared/`

See: [`docs/MOVE_MAP.csv`](./docs/MOVE_MAP.csv) for complete mapping

**Key Moves**:
- `lib/agents/*` → `modules/documentation/agent/` (11 files)
- `lib/ai/*` → `shared/lib/ai/` (3 files)
- `lib/auth/*` → `shared/lib/auth/` + `modules/github/auth/` (4 files)
- `lib/github/*` → `modules/github/` (merge into SSOT)
- Components → `modules/documentation/components/` + `shared/components/` (11 files)

### Files Deleted (PHASE 4)
**6 files deleted** (proof-based, 0 active imports)

| File | Lines | Size | Reason | Proof |
|------|-------|------|--------|-------|
| `modules/github/auth/github-app.ts` | 166 | 4.7KB | Merged into token-provider.ts | [proof](./docs/phase4/proofs/github_app_refs.before.txt) |
| `lib/github/token-provider.ts` | 216 | 5.6KB | Legacy duplicate | [proof](./docs/phase4/proofs/legacy_provider_refs.before.txt) |
| `lib/github/client.ts` | 235 | 6.3KB | Legacy duplicate (no upsert) | [proof](./docs/phase4/proofs/legacy_client_refs.before.txt) |
| `lib/github/operations.ts` | 440 | 10KB | Legacy duplicate | [proof](./docs/phase4/proofs/legacy_ops_refs.before.txt) |
| `lib/auth/github-token.ts` | 114 | 2.9KB | Deprecated OAuth wrapper | [proof](./docs/phase4/proofs/legacy_auth_token_refs.before.txt) |
| `lib/agents/utils/github-utils-legacy.ts` | 660 | 17KB | Unused, broken imports | [proof](./docs/phase4/proofs/github_utils_legacy_refs.before.txt) |

**Total Removed**: 1,831 lines, ~47KB

All deletions verified with `grep` proofs showing **0 active imports** before removal.

---

## 🔍 Proofs

### Path Alias Elimination
**PHASE 1 Proof**: `@/*` alias enabled, imports rewritten

```bash
# BEFORE PHASE 2
grep -R "from.*@/lib/" src | wc -l
# Result: 43 imports

# AFTER PHASE 2
grep -R "from.*@/lib/" src | wc -l  
# Result: 0 imports ✅
```

**Files**: 
- [`docs/phase2/proofs/imports.before.txt`](./docs/phase2/proofs/imports.before.txt) (43 lines)
- [`docs/phase2/proofs/imports.after.txt`](./docs/phase2/proofs/imports.after.txt) (0 lines)

### GitHub SSOT Consolidation
**PHASE 3 Proof**: All GitHub calls use `modules/github/token-provider.ts`

```typescript
// ✅ SSOT Interface (Minimal, Production-Ready)
export async function getInstallationToken(params?: {
  installationId?: number;
  repo?: string;
  correlationId?: string;
}): Promise<InstallationToken>

// Features:
// - Env var reading (APP_ID, INSTALLATION_ID, PRIVATE_KEY_PEM)
// - JWT creation with 2-min clock skew tolerance
// - Installation token exchange
// - 5-minute token caching (auto-refresh)
// - PEM format normalization (\n → newline)
// - Server-only enforcement (build-time)
```

**Active SSOT References**: 3
1. `app/api/github/app/diagnostics/route.ts` — GitHub App diagnostics
2. `modules/agents/scribe/server/runner.server.ts` — Scribe agent
3. `app/api/agent/documentation/analyze/route.ts` — Documentation agent

**Proof Files**:
- [`docs/phase3/proofs/ssot_refs.after.txt`](./docs/phase3/proofs/ssot_refs.after.txt) (3 lines)
- [`docs/phase3/proofs/legacy_providers.after.txt`](./docs/phase3/proofs/legacy_providers.after.txt) (0 active)

### Validation Results
**PHASE 4 Final Validation**

| Check | Result | File |
|-------|--------|------|
| **TypeScript (App Code)** | ✅ 0 errors | [`docs/phase4/validation/typecheck.txt`](./docs/phase4/validation/typecheck.txt) |
| **Lint** | ⚠️ Pre-existing warnings (no new errors) | [`docs/phase4/validation/lint.txt`](./docs/phase4/validation/lint.txt) |
| **Build** | ✅ SUCCESS (exit 0) | [`docs/phase4/validation/build.txt`](./docs/phase4/validation/build.txt) |
| **Dev Boot** | ✅ Boots successfully | [`docs/phase4/validation/dev_boot.txt`](./docs/phase4/validation/dev_boot.txt) |

**Note**: Next.js build cache cleared once (macOS `.next/` directory issue). Build succeeds after cache clear.

---

## ⚠️ Risk & Mitigations

### Risk 1: Token Caching Edge Cases
**Risk**: Stale tokens if cache logic fails  
**Mitigation**: 
- 5-minute safety window before expiry
- Auto-refresh on cache miss
- Correlation IDs for observability
- Structured logging tracks token lifecycle

### Risk 2: Clock Skew (Server-GitHub Time Drift)
**Risk**: JWT "issued in the future" or "expired" errors  
**Mitigation**:
- JWT `iat`: `now - 60s` (1 min backward tolerance)
- JWT `exp`: `now + 9min` (1 min forward tolerance)
- **Total tolerance**: 2 minutes

### Risk 3: PEM Format Incompatibility
**Risk**: Private key stored with escaped newlines (`\n` in string)  
**Mitigation**:
- Automatic normalization: `privateKeyPem.replace(/\\n/g, '\n')`
- Handles both raw PEM and escaped formats

### Risk 4: Module-Not-Found After Moves
**Risk**: Broken imports after file relocations  
**Mitigation**:
- **60+ imports rewritten** with automated scripts
- TypeScript validation: 0 app code errors
- Build validation: SUCCESS
- Grep proofs: 0 `@/lib/` imports remaining

---

## 🔄 Rollback Plan

### Option 1: Revert Merge (Recommended)
```bash
# After merge, revert the entire PR
git revert <merge_sha>

# Alternatively, revert individual commits
git revert <commit-sha-1> <commit-sha-2> ...
```

### Option 2: Restore Branch
```bash
# Restore from feature branch
git checkout main
git reset --hard <commit-before-merge>
```

### Option 3: Recover Deleted Files
```bash
# All deleted files recoverable via git history
git show <commit-before-phase4>:src/lib/github/client.ts > src/lib/github/client.ts
git show <commit-before-phase4>:src/lib/github/operations.ts > src/lib/github/operations.ts
# ... repeat for other deleted files

# Restore all imports
git show <commit-before-phase2>:src/app/api/github/branch/route.ts > src/app/api/github/branch/route.ts
# ... etc
```

**Safety**: No files permanently lost. All changes reversible via git history.

---

## 📝 Follow-ups (Post-Merge)

### 1. ESLint Boundary Rule (Nice-to-Have)
**Goal**: Enforce architectural boundaries (prevent `shared/` from importing `modules/`)

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/modules/*'],
            from: '@/shared/*',
            message: 'Shared modules cannot import from feature modules.'
          }
        ]
      }
    ]
  }
};
```

**Snippet**: [`docs/phase2/proofs/eslint.boundaries.md`](./docs/phase2/proofs/eslint.boundaries.md)

### 2. Test Type Packages
**Issue**: ~110 test errors due to missing `@types/jest` / `vitest` types  
**Action**: Stabilize test setup (separate PR)

### 3. Remove Empty `lib/` Directories
**Current**: `lib/agents/`, `lib/auth/`, `lib/github/` are now empty  
**Action**: Remove empty directories in follow-up cleanup PR

---

## 📊 Metrics

| Metric | Value |
|--------|-------|
| **Files Moved** | 35 |
| **Files Deleted** | 6 |
| **Lines Removed** | 1,831 |
| **Size Removed** | ~47KB |
| **@/lib/ Imports (Before)** | 43 |
| **@/lib/ Imports (After)** | ✅ **0** |
| **SSOT Refs** | 3 (diagnostics, scribe, docs) |
| **TypeScript Errors (App)** | ✅ **0** |
| **Build Status** | ✅ **SUCCESS** |
| **Remaining Files** | 62 (down from 68) |

---

## ✅ Checklist

- [x] `tsconfig.json` has `baseUrl: "."` and `paths["@/*"] = ["src/*"]`
- [x] Next.js resolves TS paths (no config changes needed)
- [x] All imports use `@/*` (100% `@/lib/` elimination)
- [x] GitHub calls use `modules/github/token-provider.ts` (SSOT)
- [x] `npx tsc --noEmit` passes (0 app code errors)
- [x] `npm run build` succeeds (after cache clear)
- [x] Dev server boots clean
- [x] PR includes proofs, diffs, and rollback plan
- [x] Deleted files have 0 active imports (grep proofs)

---

## 📚 Documentation

### Generated Artifacts
- **PHASE 1 Report**: [`docs/PHASE_1_REPORT.md`](./docs/PHASE_1_REPORT.md) (Path alias enablement)
- **PHASE 2 Report**: [`docs/PHASE_2_REPORT.md`](./docs/PHASE_2_REPORT.md) (Moves & codemods)
- **PHASE 3 Report**: [`docs/PHASE_3_REPORT.md`](./docs/PHASE_3_REPORT.md) (GitHub SSOT consolidation)
- **PHASE 4 Report**: [`docs/PHASE_4_REPORT.md`](./docs/PHASE_4_REPORT.md) (Final validation & PR prep)
- **Structure Gate Review**: [`docs/STRUCTURE_GATE_REVIEW.md`](./docs/STRUCTURE_GATE_REVIEW.md)
- **Proposed Structure**: [`docs/PROPOSED_STRUCTURE.md`](./docs/PROPOSED_STRUCTURE.md)
- **Move Map**: [`docs/MOVE_MAP.csv`](./docs/MOVE_MAP.csv)

### Proofs Directory
- `docs/phase2/proofs/` — Import before/after, batch reports
- `docs/phase3/proofs/` — SSOT consolidation, token primitives diff
- `docs/phase4/proofs/` — Deletion proofs, final SSOT refs

### Validation Directory
- `docs/phase4/validation/` — TypeScript, lint, build, dev boot outputs

---

**PR Type**: Refactor  
**Breaking Changes**: None (external API unchanged)  
**Tested**: ✅ TypeScript, Build, Dev Boot  
**Reversible**: ✅ Full rollback plan provided  

---

**AKIS Platform — Structural Refactor**  
**Phases**: 4/4 Complete  
**Duration**: ~3 hours (discovery → PR-ready)  
**Agent**: AKIS Scribe Agent (Documentation Intelligence)

