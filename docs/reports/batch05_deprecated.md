# BATCH 05 — Deprecated lib/github Files
**AKIS Platform - PHASE 2 Structural Refactor**

The following `lib/github/` files are **DEPRECATED** and marked for removal after validation. The current SSOT versions exist in `modules/github/`.

---

## DEPRECATED FILES

### 1. lib/github/client.ts
**Size**: 6.4KB  
**Reason**: Duplicate of `modules/github/client.ts` (7.1KB, newer with upsert support)  
**Current Import Count**: 0  
**Grep Proof**:
```bash
grep -R "from.*@/lib/github/client" src --include="*.ts" --include="*.tsx" 2>/dev/null
# Result: 0 matches
```

**Status**: ✅ No active imports, safe to remove  
**Action**: Add to `candidates_for_removal.md`

---

### 2. lib/github/operations.ts
**Size**: 10.6KB  
**Reason**: Duplicate of `modules/github/operations.ts` (15.3KB, newer with more operations)  
**Current Import Count**: 0  
**Grep Proof**:
```bash
grep -R "from.*@/lib/github/operations" src --include="*.ts" --include="*.tsx" 2>/dev/null
# Result: 0 matches
```

**Status**: ✅ No active imports, safe to remove  
**Action**: Add to `candidates_for_removal.md`

---

### 3. lib/github/token-provider.ts
**Size**: 5.7KB  
**Reason**: Legacy token provider; replaced by `modules/github/token-provider.ts` (7.5KB, SSOT)  
**Current Import Count**: 0 (marked @deprecated in code)  
**Grep Proof**:
```bash
grep -R "from.*@/lib/github/token-provider" src --include="*.ts" --include="*.tsx" 2>/dev/null
# Result: 0 matches
```

**Status**: ✅ No active imports, safe to remove  
**Action**: Already in `candidates_for_removal.md` (Row 4 in MOVE_MAP)

---

### 4. lib/auth/github-token.ts
**Size**: ~3KB (estimate)  
**Reason**: Deprecated wrapper around new token-provider; already marked deprecated in code  
**Current Import Count**: 0  
**Grep Proof**:
```bash
grep -R "from.*@/lib/auth/github-token" src --include="*.ts" --include="*.tsx" 2>/dev/null
# Result: 0 matches
```

**Status**: ✅ No active imports, safe to remove  
**Action**: Already in `candidates_for_removal.md` (Row 8 in MOVE_MAP)

---

## SUMMARY

| File | Size | Imports | Status |
|------|------|---------|--------|
| lib/github/client.ts | 6.4KB | 0 | ✅ Deprecated |
| lib/github/operations.ts | 10.6KB | 0 | ✅ Deprecated |
| lib/github/token-provider.ts | 5.7KB | 0 | ✅ Deprecated |
| lib/auth/github-token.ts | ~3KB | 0 | ✅ Deprecated |

**Total deprecated code**: ~25KB  
**Safe to remove**: Yes (0 active imports)  
**Action**: Listed in `candidates_for_removal.md` with proofs

