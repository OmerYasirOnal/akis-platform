# ESLint Module Boundary Enforcement (Optional)
**AKIS Platform - Structural Refactor**

---

## PURPOSE

This document provides an ESLint rule snippet to enforce the module boundary constraint:
**`shared/` cannot import from `modules/`**

This is a **design constraint** (not a technical limitation of TypeScript path aliases) that must be enforced during development to maintain architecture integrity.

---

## ESLINT CONFIGURATION

### Option 1: Flat Config (ESLint 9+)

```js
// eslint.config.mjs
import eslintPluginImport from 'eslint-plugin-import';

export default [
  {
    plugins: {
      import: eslintPluginImport,
    },
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['@/modules/*'],
          message: 'shared/ cannot import from modules/ - violates feature-sliced architecture boundaries'
        }]
      }]
    }
  },
  {
    // Specific enforcement for shared/ directory
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/modules/*', '../modules/*', '../../modules/*'],
            message: 'shared/ cannot import from modules/ - shared code must be reusable'
          },
          {
            group: ['@/app/*', '../app/*', '../../app/*'],
            message: 'shared/ cannot import from app/ - shared code must be reusable'
          }
        ]
      }]
    }
  }
];
```

---

### Option 2: Legacy Config (.eslintrc.js)

```js
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['@/modules/*'],
        message: 'Direct import from modules/ - ensure this is intentional and follows architecture boundaries'
      }]
    }]
  },
  overrides: [
    {
      // Strict enforcement for shared/ directory
      files: ['src/shared/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: ['@/modules/*', '../modules/*', '../../modules/*'],
              message: 'shared/ cannot import from modules/ - violates architecture'
            },
            {
              group: ['@/app/*', '../app/*', '../../app/*'],
              message: 'shared/ cannot import from app/ - violates architecture'
            }
          ]
        }]
      }
    },
    {
      // Allow modules/ to import from shared/
      files: ['src/modules/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': ['off']
      }
    }
  ]
};
```

---

## BOUNDARY RULES ENFORCED

| From | To | Allowed | Rule |
|------|-----|---------|------|
| `shared/*` | `modules/*` | ❌ NO | Enforced by ESLint |
| `shared/*` | `app/*` | ❌ NO | Enforced by ESLint |
| `modules/*` | `shared/*` | ✅ YES | No restriction |
| `modules/*` | other `modules/*` | ⚠️ CAUTION | Only infrastructure (e.g., `github`) |
| `app/*` | `modules/*`, `shared/*` | ✅ YES | No restriction |
| `contexts/*` | `shared/types`, `shared/lib/auth` | ✅ YES | Specific imports only |
| `contexts/*` | `modules/*` | ❌ NO | Manual enforcement |

---

## INSTALLATION

### Required Packages

```bash
# ESLint (likely already installed)
npm install --save-dev eslint

# Optional: Import plugin for advanced checks
npm install --save-dev eslint-plugin-import
```

---

## USAGE

### Validate Rules

```bash
# Check for boundary violations:
npm run lint

# Example error output:
# src/shared/components/SomeComponent.tsx
#   5:1  error  shared/ cannot import from modules/ - violates architecture  no-restricted-imports
```

### Auto-fix (if possible)

```bash
npm run lint -- --fix
```

Note: `no-restricted-imports` violations require manual fixes (refactoring imports).

---

## TESTING THE RULE

### Test Case 1: Violation in shared/

```ts
// src/shared/components/TestComponent.tsx
import { documentationAgent } from '@/modules/documentation/agent/documentation-agent';
//                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// ❌ ERROR: shared/ cannot import from modules/ - violates architecture
```

**Expected**: ESLint error

---

### Test Case 2: Allowed in modules/

```ts
// src/modules/documentation/components/DocComponent.tsx
import { logger } from '@/shared/lib/utils/logger';
// ✅ OK: modules/ can import from shared/
```

**Expected**: No error

---

### Test Case 3: Allowed in app/

```ts
// src/app/dashboard/page.tsx
import { documentationAgent } from '@/modules/documentation/agent/documentation-agent';
import { logger } from '@/shared/lib/utils/logger';
// ✅ OK: app/ can import from both modules/ and shared/
```

**Expected**: No error

---

## RATIONALE

### Why Enforce This?

1. **Reusability**: Shared code must not depend on feature-specific logic (modules)
2. **Scalability**: New modules can be added without affecting shared code
3. **Testability**: Shared code can be tested in isolation
4. **Clear boundaries**: Prevents accidental coupling between layers

### What If I Need Module Code in Shared?

**Solution**: Extract the needed logic into `shared/` as a generic utility.

**Example**:
```ts
// ❌ BAD: shared/ importing from modules/
// src/shared/components/RepoCard.tsx
import { getRepoTree } from '@/modules/github/operations';

// ✅ GOOD: Extract to shared/
// src/shared/lib/github/helpers.ts
export function parseRepoUrl(url: string) { /* ... */ }

// src/shared/components/RepoCard.tsx
import { parseRepoUrl } from '@/shared/lib/github/helpers';
```

---

## INTEGRATION INTO REFACTOR

### PHASE 1 (Current)
- ✅ Document rule (this file)
- ⏳ Optional: Add to ESLint config (not blocking)

### PHASE 2 (Moves)
- ⚠️ If rule enabled: Fix any violations discovered during import rewrites

### PHASE 4 (Validation)
- ✅ Run `npm run lint` to verify boundary compliance

---

## STATUS

**Implementation**: 🟡 **OPTIONAL (Nice-to-Have)**

**Priority**: LOW (can be added post-refactor)

**Benefit**: Automated enforcement of architecture boundaries during development

**Trade-off**: Requires ESLint setup time, may flag false positives initially

---

**Document Created**: 2025-10-27  
**Phase**: 1 (Path Alias Enablement)  
**Status**: Documentation complete, implementation deferred

