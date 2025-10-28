# Phase 0: Preflight & Branch - Checklist

**Date:** 2025-10-28  
**Branch:** `feat/github-app-mcp-poc`  
**Status:** ✅ COMPLETED

---

## ✅ Tasks Completed

### 1. Branch Creation
- **Branch Name:** `feat/github-app-mcp-poc`
- **Base Branch:** `main`
- **Status:** ✅ Created successfully
- **Evidence:**
  ```bash
  git status
  # On branch feat/github-app-mcp-poc
  ```

### 2. Node/Next Version Check
- **Node Version:** `v22.4.1` ✅
- **NPM Version:** `10.8.1` ✅
- **Next.js Version:** `16.0.0` (from package.json) ✅
- **Compatibility:** All versions compatible with implementation requirements

### 3. .env.local Configuration Check
- **Status:** ⚠️ **`.env.local` dosyası bulunamadı**
- **Template:** `env.example` mevcut ve güncel
- **Action Required:** Kullanıcının `.env.local` dosyasını oluşturması gerekiyor

---

## 📋 Required Environment Variables for POC

Görev sözleşmesine göre aşağıdaki değişkenler **zorunlu**:

```bash
# GitHub App Configuration (Module A - REQUIRED)
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
GITHUB_APP_INSTALLATION_ID=987654
GITHUB_APP_CLIENT_ID=Iv1.abcd1234
GITHUB_APP_CLIENT_SECRET=your_secret_here
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# AI/LLM Configuration (Optional for POC)
OPENROUTER_API_KEY=sk-or-...
DEFAULT_AI_MODEL=gpt-4-turbo

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug

# MCP Server Configuration (Phase 4)
MCP_PORT=3001

# Feature Flags (Phase 1)
SESSION_SERVER_ONLY=false  # Will be set to true after Phase 1
```

---

## 🔍 Existing GitHub App Infrastructure

Found **29 files** with GitHub App/installation references:

### Core Modules (Already Implemented)
- ✅ `src/modules/github/token-provider.ts` - Token provider with caching
- ✅ `src/modules/github/operations.ts` - GitHub operations layer
- ✅ `src/shared/lib/auth/actor.ts` - Actor resolution (OAuth/App)
- ✅ `src/shared/config/github.ts` - GitHub configuration

### API Routes (Already Implemented)
- ✅ `/api/github/app/diagnostics` - Installation diagnostics (⭐ **POC_PLAN Phase 1 uses this**)
- ✅ `/api/github/app/install-info` - Installation info
- ✅ `/api/github/repos` - Repository listing
- ✅ `/api/github/repositories` - Repository details
- ✅ `/api/github/branch` - Branch operations
- ✅ `/api/github/connect` - OAuth connect

### UI Components (Already Implemented)
- ✅ `src/shared/components/integrations/GitHubIntegration.tsx` - Main integration UI (⭐ **POC_PLAN Phase 3 enhances this**)
- ✅ `src/shared/components/github/RepoPicker.tsx` - Repo picker
- ✅ `src/shared/components/github/GitHubConnect.tsx` - Connect button
- ✅ `src/shared/components/github/BranchCreator.tsx` - Branch creator

### Tests (Already Implemented)
- ✅ `src/__tests__/e2e/github-app-auth.test.ts` - E2E auth tests
- ✅ `src/__tests__/integration/scribe-app-only.test.ts` - Integration tests
- ✅ `src/__tests__/unit/actor.test.ts` - Actor unit tests

---

## 📊 Phase 0 Summary

| Item | Status | Notes |
|------|--------|-------|
| Branch created | ✅ | `feat/github-app-mcp-poc` |
| Node version OK | ✅ | v22.4.1 |
| NPM version OK | ✅ | 10.8.1 |
| Next.js version OK | ✅ | 16.0.0 |
| .env.local exists | ⚠️ | **HITL Required** |
| GitHub App infra | ✅ | Already implemented |

---

## 🚦 HITL Checkpoint: .env.local Configuration

**⚠️ ACTION REQUIRED:**

Kullanıcının aşağıdaki adımları tamamlaması gerekiyor:

1. `.env.local` dosyası oluştur:
   ```bash
   cp env.example .env.local
   ```

2. GitHub App bilgilerini doldur:
   - `GITHUB_APP_ID`: GitHub App Settings → About → App ID
   - `GITHUB_PRIVATE_KEY`: GitHub App Settings → Private keys → Generate a private key
   - `GITHUB_APP_INSTALLATION_ID`: Install URL'den alınabilir
   - `GITHUB_APP_CLIENT_ID` ve `GITHUB_APP_CLIENT_SECRET`: GitHub App Settings → OAuth

3. (Opsiyonel) AI/LLM anahtarlarını doldur (POC için gerekli değil)

**Alternatif:** Mock mode ile devam edilebilir:
```bash
MOCK_GITHUB_API=true
```

---

## ✅ Phase 0: COMPLETED

**Next Step:** Phase 1 - Data Layer & Sessions (Scaffold)

**Note:** .env.local yoksa kullanıcıya çağrı yapılacak veya mock mode ile devam edilecek.

---

**Document Owner:** AKIS Scribe Agent  
**Phase:** 0 / 5  
**Gate:** N/A (No gate for Phase 0)

