# REPO AUDIT REPORT
**AKIS Platform - Discovery-First Structural Refactor**

---

## EXECUTIVE SUMMARY

| Metric | Value | Status |
|--------|-------|--------|
| **Branch** | `main` | ✅ |
| **Modified Files** | 5 tracked, ~100 untracked | ⚠️ Clean commit recommended |
| **Total Imports** | 161 | ✅ |
| **Deep Relative Imports** | 0 | ✅ Excellent |
| **Aliased Imports (@/)** | 70 (43.5%) | ✅ Strong adoption |
| **GitHub API Touchpoints** | 33 locations | ⚠️ Scattered |
| **Token Provider Duplication** | 3 providers | 🔴 CRITICAL |
| **Module Errors** | 0 in source | ✅ |
| **Missing "use client"** | All components | ⚠️ Requires verification |

**Overall Assessment**: Codebase stable, iyi alias kullanımı mevcut, ancak **kritik duplication** ve **eksik baseUrl** yapısal refactor'u zorunlu kılıyor.

---

## 1. REPOSITORY STATE

### Git Status
**Source**: `docs/audit/branch.txt`, `docs/audit/status.txt`

**Current Branch**: `main`

**Working Directory**:
- 5 modified tracked files:
  - `README.md`
  - `package.json`, `package-lock.json`
  - `src/app/layout.tsx`
  - `src/app/page.tsx`
- ~100 untracked documentation files
- Git status clean except for docs sprawl

**Recommendation**: Commit or stash pending changes before starting refactor

---

## 2. DIRECTORY STRUCTURE ANALYSIS

### Tree Snapshots
**Source**: `docs/audit/TREE_L3.txt`, `docs/audit/TREE_L5.txt`

#### Current Structure (High-Level)
```
devagents/
├── docs/              # Documentation (audit outputs here)
├── prompts/           # Cursor/AI prompts
├── scripts/           # Validation scripts (doc-proof, link-check, etc.)
├── src/
│   ├── __tests__/     # Test suites (e2e, integration, unit)
│   ├── app/           # Next.js App Router (Server Components)
│   │   ├── actions/   # Server Actions
│   │   ├── api/       # API routes
│   │   ├── dashboard/ # UI pages
│   │   ├── login/
│   │   ├── profile/
│   │   └── register/
│   ├── components/    # React components (flat structure)
│   ├── contexts/      # React contexts (AuthContext)
│   ├── lib/           # LEGACY library code
│   │   ├── agents/    # Documentation agents
│   │   ├── ai/        # OpenRouter integration
│   │   ├── auth/      # Auth primitives (github-app.ts)
│   │   ├── github/    # ⚠️ DUPLICATE GitHub client
│   │   ├── services/  # MCP service
│   │   └── utils/     # Logger, diagnostics
│   ├── modules/       # MODERN feature modules
│   │   ├── agents/    # Scribe agent server-side logic
│   │   ├── github/    # ⚠️ DUPLICATE GitHub client (newer)
│   │   └── mcp/       # MCP server
│   └── shared/        # Shared config
│       └── config/
├── tsconfig.json
├── next.config.ts
├── package.json
└── [40+ root-level .md files]
```

### Critical Duplication Detected

#### GitHub Operations (DUPLICATE)
**Evidence**: `docs/audit/TREE_L3.txt`, file listings

| Path | Files | Notes |
|------|-------|-------|
| `src/lib/github/` | `client.ts`, `operations.ts`, `token-provider.ts`, `__tests__/` | Legacy, but still imported |
| `src/modules/github/` | `client.ts`, `operations.ts`, `token-provider.ts`, `upsert.ts`, `__tests__/` | Current, has additional `upsert.ts` |

**Consequence**: 
- Kod tekrarı → maintenance burden
- Hangi versiyonun kullanılacağı belirsiz
- Test coverage split (her ikisinin de `__tests__/` var)

**Proof (grep excerpt)**:
```
src/lib/github/token-provider.ts → imported in tests, deprecated
src/modules/github/token-provider.ts → imported in app code, current
```

---

## 3. TYPESCRIPT & NEXT.JS CONFIGURATION

### tsconfig.json Analysis
**Source**: `docs/audit/tsconfig.json.snapshot`

**Current Config**:
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]   ← ✅ ALIAS defined
    },
    // ⚠️ baseUrl MISSING
  }
}
```

**Issues**:
1. ⚠️ `baseUrl` eksik → `paths` aliasing bazı edge case'lerde fail edebilir
2. ✅ `@/*` alias tanımlı → import rewrite'lar kolaylaştırılmış
3. ✅ Next.js plugin aktif

### next.config.ts Analysis
**Source**: `docs/audit/next.config.snapshot`

**Current Config**:
```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { /* config options here */ };
export default nextConfig;
```

**Assessment**:
- Minimal config, webpack override yok
- Next.js ≥14 otomatik olarak `tsconfig.paths` resolve eder
- Risk: baseUrl yokluğu bazı import'ları bozabilir

### Alias Check Summary
**Source**: `docs/audit/alias_check.txt`

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| `baseUrl` | `"."` | `undefined` | ⚠️ ISSUE |
| `paths["@/*"]` | `["src/*"]` | `["./src/*"]` | ✅ OK |
| Next.js Resolution | Automatic | Default | ⚠️ VERIFY |

**Recommendation**:
```diff
{
  "compilerOptions": {
+   "baseUrl": ".",
    "paths": {
-     "@/*": ["./src/*"]
+     "@/*": ["src/*"]
    }
  }
}
```

---

## 4. IMPORT GRAPH & ALIAS ADOPTION

### Statistics
**Source**: `docs/audit/import_stats.txt`, `docs/audit/deep_relatives_samples.txt`, `docs/audit/aliased_samples.txt`

| Metric | Count | Percentage |
|--------|-------|------------|
| Total imports | 161 | 100% |
| Deep relative (`../../..`) | 0 | 0% ✅ |
| Aliased (`@/`) | 70 | 43.5% ✅ |
| Remaining (relative/external) | 91 | 56.5% |

### Import Pattern Breakdown

**Aliased Import Sample** (first 10):
```ts
// src/contexts/AuthContext.tsx
import { User, UserIntegration, AuthState } from '@/lib/auth/types';
import { AuthStorage } from '@/lib/auth/storage';

// src/app/dashboard/page.tsx
import { useAuth } from '@/contexts/AuthContext';
import { DocumentAgent } from '@/components/DocumentAgent';

// src/app/actions/scribe.ts
import { runScribeServer } from '@/modules/agents/scribe/server/runner.server';
import { logger } from '@/lib/utils/logger';
```

**Key Observations**:
1. ✅ Modern kod `@/*` kullanıyor
2. ✅ Derin relative chain (`../../../`) YOK → refactor kolaylaşacak
3. ⚠️ Bazı dosyalar hâlâ relative import kullanıyor (örn. `./types`, `../utils`)
4. ✅ Cross-module imports temiz (örn. `@/modules/github` ← `@/app/actions`)

**Conclusion**: Import hygiene **mükemmel**. Remaining relative imports çoğunlukla same-directory imports (`./types`) olup normal.

---

## 5. GITHUB APP INTEGRATION MAPPING

### API Touchpoints
**Source**: `docs/audit/github_calls.txt`

**Total Occurrences**: 33 direct `api.github.com` calls

**Breakdown by Category**:
1. **User APIs** (4): `/user`, `/user/repos`
2. **Repository APIs** (8): `/repos/{owner}/{repo}/contents`, `/repos/{owner}/{repo}/branches`
3. **Git Data APIs** (6): `/repos/{owner}/{repo}/git/refs`, `/git/trees`
4. **Pull Request APIs** (3): `/repos/{owner}/{repo}/pulls`
5. **Installation APIs** (4): `/app/installations/{id}`, `/installation/repositories`
6. **Rate Limit APIs** (1): `/rate_limit`
7. **Client Instantiation** (7): `new GitHubClient()` mentions

**High-Traffic Files**:
- `src/lib/agents/utils/github-utils-legacy.ts`: 11 direct fetch calls
- `src/lib/services/mcp.ts`: 5 direct fetch calls
- `src/app/api/github/*/route.ts`: Multiple route handlers

### Token Flow Mapping
**Source**: `docs/audit/token_flows.txt`

**Environment Variables** (92 occurrences):
- `GITHUB_APP_ID`: 25 occurrences
- `GITHUB_APP_INSTALLATION_ID`: 31 occurrences
- `GITHUB_APP_PRIVATE_KEY_PEM`: 25 occurrences
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`: OAuth flow

**Token Issuance Entry Points** (3 DUPLICATE providers):

#### 1. `src/lib/auth/github-app.ts` (Root Primitive)
```ts
export async function getInstallationToken(installationId: number): Promise<TokenResult>
export async function getCachedGitHubAppToken(): Promise<TokenResult>
```
- **Role**: JWT creation, token acquisition from GitHub API
- **Dependencies**: `jsonwebtoken`, `process.env.GITHUB_APP_*`
- **Status**: Core implementation, used by other providers

#### 2. `src/lib/github/token-provider.ts` (Deprecated Wrapper)
```ts
export async function getGitHubToken(options: TokenProviderOptions): Promise<TokenResult>
```
- **Role**: Wrapper around `github-app.ts`
- **Status**: Deprecated (test dosyalarında hâlâ import ediliyor)
- **Issue**: Test isolation için mock edilmeye çalışılmış

#### 3. `src/modules/github/token-provider.ts` (Current SSOT Candidate)
```ts
export async function getGitHubToken(options: TokenProviderOptions): Promise<TokenResult>
```
- **Role**: Unified token provider, imports from `lib/auth/github-app.ts`
- **Features**: Actor support, fallback logic, caching
- **Status**: Current recommended, used in `@/app/api/agent/*`, `@/modules/agents/scribe/*`

**Flow Diagram**:
```
[process.env.*] 
    ↓
[lib/auth/github-app.ts] ← JWT creation, raw token fetch
    ↓                       ↓
[lib/github/token-provider.ts]  [modules/github/token-provider.ts]
   (deprecated)                     (current)
    ↓                                 ↓
[test files]                    [app routes, agents]
```

### Single Source of Truth Violation
**Status**: 🔴 **CRITICAL**

**Problem**: 
- 3 token providers aktif
- Import yolları karışık
- Test ve production kod farklı provider'lar kullanıyor
- Deprecation warnings var ama enforce edilemiyor

**Target**: 
- **SSOT**: `src/modules/github/token-provider.ts`
- **Action**: `lib/github/*` ve `lib/auth/github-app.ts` merge edilmeli
- **Outcome**: Tek bir `modules/github/token-provider.ts` kalsın

---

## 6. ERROR HOTSPOTS & MODULE RESOLUTION

### Module-Not-Found Scan
**Source**: `docs/audit/module_errors.txt`

**Result**: ✅ Kaynak dosyalarda açık hata YOK

**Note**: Bu scan string search bazlı. Runtime/build-time errors PHASE 4 validation'da yakalanacak.

### Known Issues (from docs review)
From `docs/PHASE_0_DISCOVERY_FINDINGS.md`, `docs/BUGFIX_CHECKLIST.md`:
- Previous migration'larda branch creation, PR creation hataları çözülmüş
- Actor resolution, commit authorship stabilize edilmiş
- GitHub App auth flow geçmişte sorunluymuş, şimdi çalışıyor

**Inference**: Codebase son migration'lardan sonra stabilize olmuş, ama duplication refactor edilmemiş.

---

## 7. FRAMEWORK/RUNTIME BOUNDARIES

### Server vs Client Components
**Source**: `docs/audit/use_client_flags.txt`

**Scan Result**: ⚠️ **0 "use client" directive bulundu**

**Analysis**:
Next.js App Router'da:
- Varsayılan olarak tüm component'ler **Server Component**
- Client-side interactivity için `"use client"` gerekli (hooks, event handlers)
- Eğer directive yoksa ve hook kullanılıyorsa → Next.js auto-detection veya hata

**Files with Client-Side Code** (manual detection via hook usage):
```
src/contexts/AuthContext.tsx         → useState, useEffect, createContext
src/components/DocumentationAgentUI.tsx → useState, hooks
src/components/GitHubRepositories.tsx   → useState, fetch
src/app/dashboard/page.tsx           → useAuth (client hook)
src/app/profile/page.tsx             → useAuth
src/app/login/page.tsx               → useAuth
```

**Risk**: 
- Eğer bu dosyalarda "use client" yoksa ve Next.js bunları Server Component olarak treat ediyorsa → **SSR/hydration hatası**
- Alternatif: Next.js transpiler otomatik ekliyor (unlikely, genelde explicit olmalı)

**ACTION REQUIRED**: 
1. Component'leri manuel incele
2. Gerekli yerlere `"use client"` ekle
3. PHASE 4 validation'da build testi ile doğrula

---

## 8. RISKS & MITIGATION

### High Priority Risks

#### Risk 1: GitHub Provider Duplication
**Impact**: 🔴 High  
**Likelihood**: 100% (mevcut)  
**Consequence**: 
- Token caching inconsistency
- Bug fix'ler iki yerde uygulanmalı
- Test coverage incomplete

**Mitigation**:
- PHASE 2: Merge `lib/github/` → `modules/github/`
- Deprecate `lib/auth/github-app.ts`, move logic to `modules/github/token-provider.ts`
- Update all imports → `@/modules/github/token-provider`

#### Risk 2: Missing baseUrl
**Impact**: ⚠️ Medium  
**Likelihood**: 30% (edge cases)  
**Consequence**: 
- Path resolution fail in monorepo scenarios
- Import alias not working in certain contexts

**Mitigation**:
- PHASE 1: Add `"baseUrl": "."` to `tsconfig.json`
- Update `paths["@/*"]` to `["src/*"]` (remove leading `./`)
- Verify with `npm run typecheck`

#### Risk 3: Missing "use client" Directives
**Impact**: ⚠️ Medium  
**Likelihood**: 50%  
**Consequence**: 
- SSR errors on client-only code
- Hydration mismatches
- Runtime crashes

**Mitigation**:
- Manual audit all `components/*.tsx`
- Add `"use client"` where hooks/browser APIs used
- Test with `npm run build` + dev server boot

### Medium Priority Risks

#### Risk 4: Legacy GitHub Utils
**Files**: `src/lib/agents/utils/github-utils-legacy.ts`

**Impact**: ⚠️ Medium  
**Consequence**: Direct fetch calls bypass token provider, no caching

**Mitigation**: Migrate to `@/modules/github/operations`

#### Risk 5: Flat Component Structure
**Impact**: ⚠️ Low  
**Consequence**: 80+ components tek dizinde, navigate zor

**Mitigation**: Organize into subcategories (optional, PHASE 2)

### Low Priority Risks

#### Risk 6: Documentation Sprawl
**Impact**: ⚠️ Low  
**Note**: 40+ .md files root'ta → repo clutter

**Mitigation**: Out of scope for this refactor

---

## 9. RECOMMENDATIONS FOR PHASE A (Structure Gate)

### Proposed Move Map (High-Level)

| From | To | Reason |
|------|-----|--------|
| `lib/github/*` | `modules/github/*` | Consolidate duplication, keep newer version |
| `lib/auth/github-app.ts` | `modules/github/token-provider.ts` | Merge into SSOT |
| `lib/agents/*` | `modules/documentation/agent/*` | Feature-sliced architecture |
| `lib/ai/*` | `shared/lib/ai/*` | Shared utility, not feature-specific |
| `lib/utils/*` | `shared/lib/utils/*` | Shared utilities |
| `lib/services/mcp.ts` | `modules/mcp/server/mcp.ts` | Group by feature |
| `components/*` | `shared/components/*` | (Optional) Organize by category |

### Target Structure (Preview)
```
src/
├── app/                      # Next.js routes (no change)
├── modules/                  # Feature modules
│   ├── github/
│   │   ├── token-provider.ts  ← SSOT
│   │   ├── client.ts
│   │   ├── operations.ts
│   │   ├── upsert.ts
│   │   └── __tests__/
│   ├── documentation/
│   │   ├── agent/            ← from lib/agents/*
│   │   ├── playbooks/
│   │   └── services/
│   └── mcp/
│       └── server/
├── shared/
│   ├── components/           ← from components/*
│   ├── lib/
│   │   ├── ai/               ← from lib/ai/*
│   │   └── utils/            ← from lib/utils/*
│   ├── types/                ← from lib/auth/types, contracts
│   └── config/               ← keep shared/config
└── contexts/                 # Keep as-is (React contexts)
```

**Estimated Moves**: 50-70 files

---

## 10. FOLLOW-UP QUESTIONS (HITL GATE)

Before proceeding to PHASE A, please confirm:

### Q1: Client Component Strategy
**Context**: No "use client" directives found, but components use hooks.

**Question**: 
- Next.js otomatik handle ediyor mu? 
- Yoksa manuel olarak `"use client"` eklememiz gerekiyor mu?
- Dev server şu anda çalışıyor mu, hata var mı?

### Q2: lib/github Deprecation
**Context**: `lib/github/` ve `modules/github/` duplication.

**Question**:
- `lib/github/` tamamen silinebilir mi?
- Backward compatibility gerekiyor mu?
- Test'ler migrate edilebilir mi?

### Q3: Legacy Utils Removal
**File**: `lib/agents/utils/github-utils-legacy.ts`

**Question**:
- Bu dosya hâlâ kritik dependency mi?
- Kaldırılabilir mi yoksa migration gerekiyor mu?

### Q4: Component Organization
**Context**: 80+ component tek dizinde.

**Question**:
- Component'leri kategorize etmek ister misiniz? (forms/, layouts/, features/)
- Yoksa flat structure tercih ediliyor mu?

### Q5: Validation Baseline
**Question**:
- Şu anda `npm run build` başarılı mı?
- Dev server hatasız boot oluyor mu?
- Bilinen linter/typecheck errors var mı?

---

## 11. NEXT STEPS

**Current Gate**: 🛑 **PHASE -1 COMPLETE → HITL: Audit Gate**

**Required Actions**:
1. ✅ Review this audit report
2. ❓ Answer follow-up questions (Section 10)
3. ❓ Approve or request clarifications
4. ⏭️ After approval → Proceed to **PHASE A: Target Structure & Move Plan**

**PHASE A Deliverables** (upon approval):
- `docs/MOVE_MAP.csv` (from → to, reason, boundary)
- `docs/PROPOSED_STRUCTURE.md` (detailed target tree)
- Module boundary rules

---

## APPENDIX: PROOF ARTIFACTS

All raw data stored in `docs/audit/`:

| File | Purpose |
|------|---------|
| `branch.txt` | Current git branch |
| `status.txt` | Git working directory status |
| `TREE_L3.txt`, `TREE_L5.txt` | Directory structure snapshots |
| `tsconfig.json.snapshot` | TypeScript config backup |
| `next.config.snapshot` | Next.js config backup |
| `alias_check.txt` | Path alias validation results |
| `import_stats.txt` | Import counts (total, deep, aliased) |
| `deep_relatives_samples.txt` | Deep relative import samples (0 found) |
| `aliased_samples.txt` | @/ aliased import samples (70 found) |
| `github_calls.txt` | api.github.com touchpoints (33 found) |
| `token_flows.txt` | Token/env var references (92 found) |
| `use_client_flags.txt` | Client component directives (0 found) |
| `module_errors.txt` | Module-not-found errors (0 found) |
| `findings.md` | Detailed findings summary |

---

**Report Generated**: 2025-10-27  
**Auditor**: AKIS Scribe Agent (Principal Engineer Mode)  
**Status**: AWAITING HITL APPROVAL

