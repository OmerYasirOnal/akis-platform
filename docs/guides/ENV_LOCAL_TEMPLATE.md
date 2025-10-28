# `.env.local` Configuration Template

## 🚨 CRITICAL: Copy this content to your `.env.local` file

Create a file at `devagents/.env.local` with the following content:

```bash
# ========================================
# AKIS Platform - Environment Variables
# ========================================

# ========================================
# AI/LLM Configuration (REQUIRED) ⚠️
# ========================================
# OpenRouter API Key (FREE - Recommended)
# Get your FREE key at: https://openrouter.ai/keys
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Alternative: OpenAI API Key (if you prefer OpenAI)
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ========================================
# GitHub OAuth (CURRENT - Working) ✅
# ========================================
# Create OAuth App at: https://github.com/settings/developers
GITHUB_CLIENT_ID=Ov23xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23xxxxxxxxxxxxx

# ========================================
# GitHub App (NEW - Optional) 🔐
# ========================================
# Create GitHub App at: https://github.com/settings/apps/new
# GITHUB_APP_ID=123456
# GITHUB_APP_INSTALLATION_ID=7890123
# GITHUB_APP_PRIVATE_KEY_PEM="-----BEGIN RSA PRIVATE KEY-----
# MIIEpAIBAAKCAQEA...
# -----END RSA PRIVATE KEY-----"

# ========================================
# Agent Configuration
# ========================================
ALLOW_LOW_DAS=false
MAX_FILES_TO_SCAN=200
MAX_RUN_TIME=180

# ========================================
# Development
# ========================================
NODE_ENV=development
DEBUG=false
```

---

## 📝 Step-by-Step Setup

### 1. Get OpenRouter API Key (FREE)

1. Go to https://openrouter.ai/
2. Sign up with GitHub or Google
3. Go to https://openrouter.ai/keys
4. Click "Create Key"
5. Copy the key (starts with `sk-or-v1-...`)
6. Paste it as `OPENROUTER_API_KEY` in `.env.local`

**Important:** This is **100% FREE** for the models we use (Llama 3.3 70B)!

---

### 2. Verify GitHub OAuth (Already Working)

Your GitHub OAuth should already have these values in `.env.local`:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `NEXT_PUBLIC_GITHUB_CLIENT_ID`

If missing, create OAuth App at https://github.com/settings/developers

---

### 3. Test Your Configuration

After creating `.env.local`, restart the dev server:

```bash
cd devagents
npm run dev
```

Check server logs for:
- ✅ `[OpenRouter] API key loaded`
- ✅ `[GitHub OAuth] Client ID loaded`

---

## 🔍 Troubleshooting

### Error: "OpenAI API key is missing"

**Cause:** `OPENROUTER_API_KEY` not set in `.env.local`

**Solution:**
1. Create `.env.local` if it doesn't exist
2. Add `OPENROUTER_API_KEY=sk-or-v1-...`
3. Restart dev server

### Error: "GitHub API 404"

**Cause:** Repository not accessible with current token

**Solution:**
1. Check GitHub OAuth connection in Profile page
2. Ensure you have access to the repository
3. Try with a public repository first

---

## ✅ Validation Checklist

- [ ] `.env.local` file exists in `devagents/` directory
- [ ] `OPENROUTER_API_KEY` is set (starts with `sk-or-v1-`)
- [ ] `GITHUB_CLIENT_ID` is set
- [ ] `GITHUB_CLIENT_SECRET` is set
- [ ] Dev server restarts without errors
- [ ] Can login and see GitHub integration in Profile

---

## 🎯 Quick Test

After setup, test the Scribe Agent:

```bash
# 1. Start server
npm run dev

# 2. Open browser
# http://localhost:3000

# 3. Login → Profile → Connect GitHub

# 4. Dashboard → Documentation Agent

# 5. Select a repository and run agent
```

Expected result:
- ✅ No "API key missing" errors
- ✅ Repository files load successfully
- ✅ Documentation generated
- ✅ PR created

---

## 📞 Still Having Issues?

If you see errors after following this guide, check:

1. **Server logs** (terminal where you ran `npm run dev`)
2. **Browser console** (F12 → Console)
3. **Network tab** (F12 → Network)

Common issues:
- **Port 3000 in use**: Kill the process or use different port
- **Module not found**: Run `npm install`
- **API key invalid**: Regenerate key from OpenRouter

