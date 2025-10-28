# PROPOSED STRUCTURE — Feature-Sliced Architecture
**AKIS Platform - Target Structure for PHASE 2 Moves**

---

## OVERVIEW

This document defines the **target directory structure** after consolidation and refactoring. The structure follows **feature-sliced architecture** principles:

- **`modules/`**: Domain/feature-specific code with clear boundaries
- **`shared/`**: Reusable utilities, components, types, and services
- **`app/`**: Next.js routes (no changes)
- **`contexts/`**: React contexts (no changes)

**Total Files to Move**: 38 files  
**Deprecated/Candidate for Removal**: 3 files  
**New Directory Structure**: 15 new subdirectories

---

## 1. TARGET TREE (Concrete Paths)

```
src/
├── __tests__/                    # Test suites (no change)
│   ├── e2e/
│   ├── integration/
│   └── unit/
│
├── app/                          # Next.js App Router (no change)
│   ├── actions/
│   ├── api/
│   ├── dashboard/
│   ├── login/
│   ├── profile/
│   ├── register/
│   ├── layout.tsx
│   └── page.tsx
│
├── contexts/                     # React contexts (no change)
│   └── AuthContext.tsx
│
├── modules/                      # Feature modules (expanded)
│   ├── agents/
│   │   └── scribe/
│   │       ├── client/
│   │       │   └── runner.client.ts        ← from lib/agents/scribe/runner.ts
│   │       └── server/
│   │           └── runner.server.ts        (existing)
│   │
│   ├── documentation/            # NEW module
│   │   ├── agent/
│   │   │   ├── documentation-agent.ts      ← from lib/agents/
│   │   │   ├── document-agent.ts
│   │   │   ├── document-agent-v2.ts
│   │   │   ├── base-agent.ts
│   │   │   ├── types.ts                    ← from lib/agents/documentation-agent-types.ts
│   │   │   ├── shared-types.ts             ← from lib/agents/types.ts (renamed)
│   │   │   └── utils/
│   │   │       ├── github-utils.ts
│   │   │       └── github-utils-v2.ts
│   │   ├── components/                     # NEW directory
│   │   │   ├── DocumentAgent.tsx           ← from components/
│   │   │   ├── DocumentationAgentUI.tsx
│   │   │   ├── AgentPlaybookViewer.tsx
│   │   │   └── AgentRunPanel.tsx
│   │   └── playbooks/
│   │       ├── documentation-agent-playbook.ts
│   │       └── document-agent-playbook.ts
│   │
│   ├── github/                   # Consolidated GitHub module
│   │   ├── token-provider.ts               (existing - SSOT)
│   │   ├── client.ts                       (existing + merged from lib/)
│   │   ├── operations.ts                   (existing + merged from lib/)
│   │   ├── upsert.ts                       (existing)
│   │   ├── auth/                           # NEW subdirectory
│   │   │   └── github-app.ts               ← from lib/auth/github-app.ts
│   │   └── __tests__/
│   │       ├── token-provider.test.ts      (existing)
│   │       ├── token-provider-legacy.test.ts  ← from lib/github/__tests__/
│   │       ├── operations.test.ts          (existing)
│   │       ├── operations-legacy.test.ts   ← from lib/github/__tests__/
│   │       └── upsert.test.ts              (existing)
│   │
│   └── mcp/
│       └── server/                         (existing)
│
├── shared/                       # Shared code (expanded)
│   ├── components/               # NEW directory
│   │   ├── ai/
│   │   │   └── ModelSelector.tsx           ← from components/
│   │   ├── github/
│   │   │   ├── BranchCreator.tsx           ← from components/
│   │   │   ├── GitHubConnect.tsx
│   │   │   ├── GitHubRepositories.tsx
│   │   │   └── RepoPicker.tsx
│   │   └── integrations/
│   │       ├── GitHubIntegration.tsx       ← from components/integrations/
│   │       └── GitHubPATIntegration.tsx
│   │
│   ├── config/
│   │   └── github.ts                       (existing)
│   │
│   ├── lib/                      # NEW directory
│   │   ├── ai/
│   │   │   ├── models.ts                   ← from lib/ai/
│   │   │   ├── openrouter.ts
│   │   │   └── usage-tracker.ts
│   │   ├── auth/
│   │   │   ├── actor.ts                    ← from lib/auth/
│   │   │   └── storage.ts
│   │   └── utils/
│   │       ├── logger.ts                   ← from lib/utils/
│   │       └── diagnostic.ts
│   │
│   ├── services/                 # NEW directory
│   │   └── mcp.ts                          ← from lib/services/
│   │
│   └── types/                    # NEW directory
│       ├── auth.ts                         ← from lib/auth/types.ts
│       └── contracts/
│           └── github-branch.ts            ← from lib/contracts/
│
└── lib/                          # DEPRECATED (will be empty after moves)
    └── (empty - candidate for removal after validation)
```

---

## 2. MODULE BOUNDARIES & IMPORT RULES

### Dependency Graph
```
app/ ──────────────────┐
                       ↓
contexts/ ────→ shared/ ←──── modules/
                       ↑
modules/ ──────────────┘
```

### Import Rules

| Module | Can Import From | Cannot Import From |
|--------|-----------------|-------------------|
| **`app/`** | `modules/*`, `shared/*`, `contexts/*` | Direct `lib/*` (deprecated) |
| **`contexts/`** | `shared/types`, `shared/lib/auth` | `modules/*`, `app/*` |
| **`modules/documentation/`** | `modules/github`, `shared/*` | `modules/agents`, `app/*` |
| **`modules/github/`** | `shared/lib`, `shared/types` | `modules/documentation`, `app/*` |
| **`modules/agents/scribe/`** | `modules/github`, `modules/documentation`, `shared/*` | `app/*` |
| **`shared/components/`** | `shared/lib`, `shared/types`, `contexts/*` | `modules/*`, `app/*` |
| **`shared/lib/`** | Other `shared/lib`, `shared/types` | `modules/*`, `app/*`, `contexts/*` |
| **`shared/services/`** | `shared/lib`, `shared/types` | `modules/*` (except as adapters) |
| **`shared/types/`** | Nothing (pure types) | Everything |

### Key Principles
1. **Shared cannot depend on modules**: Shared code is reusable; modules are features.
2. **Modules can depend on shared**: Modules use shared utilities/components.
3. **Cross-module dependencies**: Only `modules/github` ← `modules/documentation` allowed (GitHub is infrastructure).
4. **App routes orchestrate**: `app/` can import from all layers.
5. **Types are always pure**: `shared/types` has no runtime dependencies.

---

## 3. MINIMAL RENAMES TO AVOID CONFLICTS

| Original | New Name | Reason |
|----------|----------|--------|
| `lib/agents/types.ts` | `modules/documentation/agent/shared-types.ts` | Avoid conflict with `documentation-agent-types.ts` → `types.ts` |
| `lib/agents/scribe/runner.ts` | `modules/agents/scribe/client/runner.client.ts` | Distinguish from `server/runner.server.ts` |
| `lib/github/__tests__/token-provider.test.ts` | `modules/github/__tests__/token-provider-legacy.test.ts` | Avoid conflict with existing test |
| `lib/github/__tests__/operations.test.ts` | `modules/github/__tests__/operations-legacy.test.ts` | Avoid conflict with existing test |

**Total Renames**: 4 files

---

## 4. GITHUB APP SSOT CONSOLIDATION

### Current State (Duplication)
```
lib/auth/github-app.ts          → JWT creation, raw token fetch
    ↓
lib/github/token-provider.ts    → Deprecated wrapper (used in tests)
    ↓
modules/github/token-provider.ts → Current SSOT candidate (used in app)
```

### Target State (Single Source)
```
modules/github/token-provider.ts  ← ONLY token source
    ↑ (imports primitives from)
modules/github/auth/github-app.ts  ← Low-level JWT/token primitives
```

**Strategy**:
1. Move `lib/auth/github-app.ts` → `modules/github/auth/github-app.ts`
2. Merge logic from `lib/github/token-provider.ts` into `modules/github/token-provider.ts` if needed
3. Update all imports to point to `@/modules/github/token-provider`
4. Deprecate `lib/github/token-provider.ts` (mark for removal)

**Proof Required (PHASE 3)**:
- `grep -R "getGitHubToken\|getInstallationToken" src` → all calls via `@/modules/github/token-provider`
- `docs/legacy_auth_refs.txt` lists all deprecated flows

---

## 5. CLIENT COMPONENT BOUNDARIES

### Server Components (Default)
All components are Server Components unless marked with `"use client"`.

### Client Components (Require "use client")
Based on hook usage (`useState`, `useEffect`, `useAuth`, etc.):

| File | Location | Rationale |
|------|----------|-----------|
| `AuthContext.tsx` | `contexts/` | Uses `useState`, `useEffect`, `createContext` |
| `DocumentationAgentUI.tsx` | `modules/documentation/components/` | Interactive form with `useState`, API calls |
| `AgentRunPanel.tsx` | `modules/documentation/components/` | Interactive panel with state management |
| `DocumentAgent.tsx` | `modules/documentation/components/` | Form interactions, state |
| `AgentPlaybookViewer.tsx` | `modules/documentation/components/` | Viewer with expand/collapse state (if interactive) |
| `BranchCreator.tsx` | `shared/components/github/` | Form with input state |
| `GitHubConnect.tsx` | `shared/components/github/` | Button with OAuth flow, browser redirect |
| `GitHubRepositories.tsx` | `shared/components/github/` | Fetch on mount, `useState` for repos |
| `RepoPicker.tsx` | `shared/components/github/` | Dropdown/selection state |
| `ModelSelector.tsx` | `shared/components/ai/` | Selection state |
| `GitHubIntegration.tsx` | `shared/components/integrations/` | Integration flow, state |
| `GitHubPATIntegration.tsx` | `shared/components/integrations/` | PAT input form, state |

**Action**: Add `"use client"` directive at the top of each file listed above during PHASE 2 moves.

### Server-Only Modules
- `modules/github/token-provider.ts`: Server-side only (env vars, private keys)
- `modules/agents/scribe/server/`: Server actions
- `app/api/**/*`: API routes (inherently server-side)

---

## 6. EXAMPLES (Representative Moves)

### Example 1: Consolidate GitHub Token Provider
**From**: `src/lib/github/token-provider.ts`  
**To**: `DEPRECATED` (mark for removal)  
**Action**: Merge any missing logic into `src/modules/github/token-provider.ts`

**Before Import**:
```ts
import { getGitHubToken } from '@/lib/github/token-provider';
```

**After Import**:
```ts
import { getGitHubToken } from '@/modules/github/token-provider';
```

---

### Example 2: Move Documentation Agent
**From**: `src/lib/agents/documentation-agent.ts`  
**To**: `src/modules/documentation/agent/documentation-agent.ts`

**Before Import**:
```ts
import { documentationAgent } from '@/lib/agents/documentation-agent';
```

**After Import**:
```ts
import { documentationAgent } from '@/modules/documentation/agent/documentation-agent';
```

---

### Example 3: Move Shared Logger
**From**: `src/lib/utils/logger.ts`  
**To**: `src/shared/lib/utils/logger.ts`

**Before Import**:
```ts
import { logger } from '@/lib/utils/logger';
```

**After Import**:
```ts
import { logger } from '@/shared/lib/utils/logger';
```

---

### Example 4: Move AI Models (Shared Utility)
**From**: `src/lib/ai/models.ts`  
**To**: `src/shared/lib/ai/models.ts`

**Before Import**:
```ts
import { DEFAULT_MODEL, FREE_MODELS } from '@/lib/ai/models';
```

**After Import**:
```ts
import { DEFAULT_MODEL, FREE_MODELS } from '@/shared/lib/ai/models';
```

---

### Example 5: Organize Component (GitHub UI)
**From**: `src/components/BranchCreator.tsx`  
**To**: `src/shared/components/github/BranchCreator.tsx`

**Before Import**:
```ts
import { BranchCreator } from '@/components/BranchCreator';
```

**After Import**:
```ts
import { BranchCreator } from '@/shared/components/github/BranchCreator';
```

**Rationale**: GitHub-related UI grouped under `shared/components/github/` for better discoverability.

---

## 7. BARREL FILES (OPTIONAL)

To simplify imports, consider adding barrel files (`index.ts`) at key locations:

```ts
// src/modules/documentation/agent/index.ts
export { documentationAgent } from './documentation-agent';
export { documentAgent } from './document-agent';
export { documentAgentV2 } from './document-agent-v2';
export * from './types';

// Usage:
// import { documentationAgent, DocumentationAgentInput } from '@/modules/documentation/agent';
```

**Barrel File Locations** (recommended):
- `src/modules/documentation/agent/index.ts`
- `src/modules/github/index.ts`
- `src/shared/lib/ai/index.ts`
- `src/shared/lib/utils/index.ts`
- `src/shared/components/github/index.ts`

**Note**: Barrel files are optional; implement only if imports become verbose.

---

## 8. MOVE EXECUTION STRATEGY (PHASE 2)

### Atomic Moves (Safe)
1. **One directory at a time**: Move all files in `lib/ai/` → `shared/lib/ai/` together
2. **Update imports immediately**: Use regex or AST tool (jscodeshift/ts-morph)
3. **Verify after each batch**: `npm run typecheck` after each directory move

### Move Order (Dependency-Safe)
1. **Types first**: `lib/auth/types.ts`, `lib/contracts/` → `shared/types/`
2. **Utilities second**: `lib/utils/`, `lib/ai/` → `shared/lib/`
3. **Services third**: `lib/services/mcp.ts` → `shared/services/`
4. **Agents fourth**: `lib/agents/` → `modules/documentation/`
5. **GitHub last**: `lib/github/`, `lib/auth/github-*` → `modules/github/` (merge logic)
6. **Components final**: `components/` → `shared/components/` or `modules/documentation/components/`

### Codemod Approach
**Option A (Regex - Fast)**:
```bash
# Example: Update logger imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' \
  's|@/lib/utils/logger|@/shared/lib/utils/logger|g' {} +
```

**Option B (AST - Safe)**:
Use `jscodeshift` or `ts-morph` to parse imports and rewrite paths programmatically.

**Proof Artifacts**:
- `docs/proofs/imports_before.txt`: Count of `@/lib/` imports before
- `docs/proofs/imports_after.txt`: Count of `@/lib/` imports after (should be 0)

---

## 9. RISKS & MITIGATION

### Risk 1: Circular Dependencies
**Scenario**: `modules/documentation` imports `modules/github` which imports `shared/lib/auth/actor` which imports types from `modules/github`

**Mitigation**:
- Keep types in `shared/types/`
- Ensure `shared/*` never imports from `modules/*`
- Use barrel files to control exports

### Risk 2: Alias Resolution Regression
**Scenario**: `@/*` imports fail after `baseUrl` change

**Mitigation**:
- Add `baseUrl: "."` in PHASE 1 before moves
- Test with `npm run typecheck` and `npm run build`
- Capture diffs in `docs/proofs/tsconfig.diff`

### Risk 3: Server/Client Boundary Drift
**Scenario**: Server-only code (token-provider) accidentally imported in client component

**Mitigation**:
- Add `"use client"` to all interactive components
- Use Next.js edge runtime checks (`typeof window`)
- Validate with dev server boot test

### Risk 4: Test Failures
**Scenario**: Tests break due to import path changes or mocked modules

**Mitigation**:
- Update test imports in sync with source moves
- Update Jest `moduleNameMapper` in `jest.config.js` if using path aliases
- Run test suite after each move batch

### Risk 5: Runtime Module-Not-Found
**Scenario**: Missed import update causes runtime crash

**Mitigation**:
- Grep for old import patterns after moves: `grep -R "@/lib/" src`
- Run dev server and navigate all routes
- Capture validation results in `docs/validation/`

---

## 10. VALIDATION CHECKLIST (PHASE 4)

After moves complete, validate:

- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] Dev server boots without errors
- [ ] No `@/lib/` imports remain: `grep -R "from ['\"]\@/lib/" src | wc -l` → 0
- [ ] All `@/modules/github/token-provider` imports work
- [ ] Client components have `"use client"` directive
- [ ] Tests pass: `npm test`

---

## 11. ROLLBACK PLAN

If any validation step fails:

1. **Revert branch**: `git checkout main && git branch -D refactor/structure`
2. **Restore from backup**: If moves partially applied, restore from `docs/audit/TREE_L5.txt` baseline
3. **Fix-forward**: If issue is minor (e.g., single import), fix in-place and re-validate

**Safety**: No files deleted in PHASE 2; all moves are additive. Legacy `lib/` can be restored if needed.

---

## 12. FOLLOW-UP (POST-REFACTOR)

After Structure Gate approval and successful validation:

1. **Remove `lib/` directory**: Once empty, delete `src/lib/`
2. **Cleanup deprecated files**: Remove items listed in `docs/candidate_for_removal.md`
3. **Document architecture**: Update `docs/ARCHITECTURE.md` with new structure
4. **Team communication**: Share Move Map and new import conventions

---

## SUMMARY

**Total Moves**: 38 files  
**New Directories**: 15  
**Deprecated Files**: 3 (marked for removal)  
**Estimated LOC Changes**: ~200 import rewrites  

**Critical Paths**:
- GitHub SSOT: `modules/github/token-provider.ts`
- Documentation Agents: `modules/documentation/agent/`
- Shared Utilities: `shared/lib/`, `shared/components/`

**Next Step**: Wait for **Structure Gate approval** before executing moves.

---

**Document Version**: 1.0  
**Date**: 2025-10-27  
**Status**: AWAITING HITL APPROVAL (Structure Gate)

