# Repo Audit Findings

## 1. DIRECTORY STRUCTURE OVERVIEW

### Current Top-Level Structure
```
src/
├── __tests__/        # Test files (e2e, integration, unit)
├── app/              # Next.js App Router (routes, API, pages)
├── components/       # React components (UI layer)
├── contexts/         # React contexts (AuthContext)
├── lib/              # Legacy library code
│   ├── agents/       # Agent implementations
│   ├── ai/           # AI/OpenRouter clients
│   ├── auth/         # Auth utilities
│   ├── contracts/    # API contracts
│   ├── github/       # GitHub operations (DUPLICATE)
│   ├── services/     # MCP service
│   └── utils/        # Utilities
├── modules/          # Modern feature modules
│   ├── agents/       # Agent modules
│   ├── github/       # GitHub operations (DUPLICATE)
│   └── mcp/          # MCP server
└── shared/           # Shared configuration
    └── config/       # GitHub config
```

### Key Observations
1. **DUPLICATION DETECTED**: GitHub işlemleri hem `src/lib/github/` hem de `src/modules/github/` altında
   - Her ikisinde de: `token-provider.ts`, `client.ts`, `operations.ts`
   - `src/modules/github/` daha yeni, `upsert.ts` de içeriyor
   - Import analizi: Her iki provider da aktif kullanımda

2. **Hybrid Architecture**: Hem `lib/` (eski) hem `modules/` (yeni) yapıları paralel çalışıyor
3. **Flat Components**: Tüm React bileşenleri `components/` altında düz, alt-kategorisiz (sadece `integrations/` var)
4. **Agents Split**: Agent kodu hem `lib/agents/` hem de `modules/agents/` altında

## 2. TYPESCRIPT & NEXT.JS CONFIGURATION

### tsconfig.json Status
- ✅ `paths["@/*"]` tanımlı: `["./src/*"]`
- ⚠️ `baseUrl` EKSIK: Target structure'da `"baseUrl": "."` olmalı
- ✅ Next.js plugin aktif
- ⚠️ Varsayılan path resolution `./src/*` ile çalışıyor ama baseUrl eksikliği sorun çıkarabilir

### next.config.ts Status
- Minimal yapılandırma, özel ayar yok
- Next.js ≥14 varsayılan olarak tsconfig paths'i resolve ediyor
- Webpack alias override'ı yok

**RECOMMENDATION**: `baseUrl: "."` ekle, aksi takdirde bazı edge case'lerde resolution sorunları çıkabilir

## 3. IMPORT GRAPH ANALYSIS

### Statistics
- **Toplam import sayısı**: 161
- **Derin relative imports (../../..)**:  0 ✅
- **Aliased imports (@/)**:  70 kullanım ✅

### Assessment
**EXCELLENT**: Codebase zaten büyük ölçüde `@/*` alias kullanıyor. Derin relative import yok, bu büyük avantaj.

### Import Patterns
- ✅ Modern kod `@/*` kullanıyor
- ✅ Cross-module imports temiz
- ⚠️ Duplicate token providers farklı yerlerden import ediliyor:
  - `@/lib/github/token-provider` (deprecated olarak işaretlenmiş)
  - `@/modules/github/token-provider` (yeni)

## 4. GITHUB APP INTEGRATION MAPPING

### API Touchpoints (33 total)
1. **Direct fetch() calls to api.github.com**: 23 occurrence
   - User APIs, repos, branches, pulls, contents
   - Locations: `src/app/api/`, `src/components/`, `src/lib/`
   
2. **Token Provider Duplication**:
   - `src/lib/github/token-provider.ts` (deprecated but still imported in tests)
   - `src/modules/github/token-provider.ts` (current, imports from `lib/auth/github-app.ts`)
   - `src/lib/auth/github-token.ts` (deprecated, wraps the new provider)

3. **Token Issuance Entry Points**:
   - `src/lib/auth/github-app.ts`: `getInstallationToken()`, `getCachedGitHubAppToken()`
   - `src/modules/github/token-provider.ts`: `getGitHubToken()`
   - Multiple env var reads: `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY_PEM`

4. **Legacy Utils (should be migrated)**:
   - `src/lib/agents/utils/github-utils-legacy.ts`: Direct api.github.com calls
   - `src/lib/agents/utils/github-utils.ts`: Uses `@/modules/github/operations`
   - `src/lib/agents/utils/github-utils-v2.ts`: Uses `@/modules/github/operations`

### Single Source of Truth Status
**VIOLATION**: Şu anda tek bir SSOT YOK. En az 3 farklı token issuance yolu:
1. `lib/auth/github-app.ts` → direct issuance
2. `lib/github/token-provider.ts` → deprecated wrapper
3. `modules/github/token-provider.ts` → current recommended

**TARGET**: `src/modules/github/token-provider.ts` should be the ONLY entry point

## 5. MODULE-NOT-FOUND & ERRORS

### Scan Results
- ✅ Kaynak dosyalarda açık module hatası YOK
- ⚠️ Runtime/build-time hataları bu scan'de görünmez
- Runtime validation: PHASE 4'te `npm run build` ile kontrol edilecek

## 6. FRAMEWORK/RUNTIME BOUNDARIES

### Server vs Client Components
- ⚠️ **"use client" directive bulunamadı** (0 occurrence)
- Bu iki durum olabilir:
  1. Tüm component'ler Server Component (olası ama `useAuth`, `useState` kullanımı var)
  2. Next.js transpiler otomatik handle ediyor
  
**ACTION REQUIRED**: `src/components/` ve `src/app/` altındaki component'leri manual inceleme ile doğrula

### Identified Client-Side Code (based on hooks)
Files using React hooks (client-side):
- `src/contexts/AuthContext.tsx` (useState, useEffect)
- `src/components/*.tsx` (çoğu hook kullanıyor)
- `src/app/dashboard/page.tsx`, `src/app/profile/page.tsx`, etc.

**RISK**: Eğer "use client" eksikse ve bunlar client components olmalıysa, SSR/hydration hataları olabilir.

## 7. RISKS & UNKNOWNS

### High Priority
1. **Duplication Risk**: `lib/github/` ve `modules/github/` arasında logic split, hata riski yüksek
2. **baseUrl Missing**: Path resolution edge case'lerde patlamaya müsait
3. **Client Directive Missing**: Bazı component'ler yanlış boundary'de olabilir

### Medium Priority
4. **Legacy Utils**: `github-utils-legacy.ts` hâlâ kullanımda
5. **Multiple Token Flows**: 3 farklı token acquisition yolu
6. **Flat Component Structure**: 80+ component tek dizinde, kategorisiz

### Low Priority
7. **Test Structure**: Testler `__tests__/` altında ama kaynak kod farklı yerde
8. **Documentation Sprawl**: 40+ markdown doc root'ta, organize değil (bu audit'in kapsamı dışı)

## 8. RECOMMENDED MOVE MAP (Preview)

### Phase A Outputs (will be detailed in PHASE A)

**Consolidation Targets**:
1. Merge `lib/github/` → `modules/github/` (keep modules version)
2. Migrate `lib/agents/` → `modules/documentation/` and `modules/agents/`
3. Organize `components/` → `shared/components/` with subcategories
4. Move `lib/utils/` → `shared/lib/`
5. Promote `modules/github/token-provider.ts` to SSOT

**Estimated Moves**: 50-70 files affected

## 9. FOLLOW-UP QUESTIONS FOR HITL

1. **Client Components**: Gerçekten "use client" olmadan çalışıyorlar mı? Next.js auto-detection güvenilir mi?
2. **lib/github deprecation**: `lib/github/` tamamen silinebilir mi yoksa backward compat gerek var mı?
3. **Legacy utils**: `github-utils-legacy.ts` kaldırılabilir mi? Hâlâ bağımlılık var mı?
4. **Component organization**: Component'leri kategorize etmek istenir mi? (forms/, layouts/, features/, etc.)

---

**Audit Date**: 2025-10-27  
**Branch**: main  
**Status**: Modified files present (5 modified, ~100 untracked docs)

