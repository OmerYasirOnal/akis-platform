# 🚀 Quick Fix Guide - AKIS Scribe Agent

## 🎯 Problem

Scribe Agent fails with:
- ❌ "OpenAI API key is missing"
- ❌ GitHub API 404 errors

---

## ✅ Solution (5 Minutes)

### Step 1: Get FREE OpenRouter API Key

1. Go to **https://openrouter.ai/**
2. Click "Sign In" → Use GitHub or Google
3. Go to **https://openrouter.ai/keys**
4. Click "**Create Key**"
5. **Copy the key** (starts with `sk-or-v1-...`)

💡 **This is 100% FREE** for the models we use!

---

### Step 2: Update `.env.local`

Open `devagents/.env.local` and add your OpenRouter key:

```bash
# Add this line (replace with YOUR key)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important:** Keep your existing `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, etc.

**Full `.env.local` example:**

```bash
# AI/LLM (REQUIRED)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# GitHub OAuth (Already working)
GITHUB_CLIENT_ID=Ov23xxxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_GITHUB_CLIENT_ID=Ov23xxxxxxxxxxxxx

# Agent Config (Optional)
ALLOW_LOW_DAS=false
MAX_FILES_TO_SCAN=200
MAX_RUN_TIME=180

# Development
NODE_ENV=development
DEBUG=false
```

---

### Step 3: Validate Environment

Run validation script:

```bash
cd devagents
npm run validate:env
```

**Expected output:**

```
✅ OPENROUTER_API_KEY is set
✅ GITHUB_CLIENT_ID is set
✅ GITHUB_CLIENT_SECRET is set
✅ NEXT_PUBLIC_GITHUB_CLIENT_ID is set

✅ ALL CHECKS PASSED
```

If you see **❌ CRITICAL ISSUES**, fix them first!

---

### Step 4: Restart Server

```bash
npm run dev
```

**Expected logs:**

```
[OpenRouter] ✅ Using OPENROUTER_API_KEY
[GitHub OAuth] Client ID loaded
✓ Ready on http://localhost:3000
```

---

### Step 5: Test Scribe Agent

1. Open **http://localhost:3000**
2. **Login** → Go to **Dashboard**
3. Click **"Documentation Agent"**
4. Select a **repository** (e.g., `UniSum-Backend`)
5. Click **"Run Agent"**

**Expected result:**

- ✅ No "API key missing" error
- ✅ Repository files load
- ✅ Documentation generated
- ✅ PR created successfully

---

## 🐛 Troubleshooting

### Issue 1: "OPENROUTER_API_KEY is missing"

**Cause:** Key not in `.env.local` or typo

**Fix:**
1. Check `.env.local` exists in `devagents/` folder
2. Verify key starts with `sk-or-v1-`
3. No spaces around `=` sign
4. Restart dev server

---

### Issue 2: GitHub API 404 Errors

**Cause:** Repository doesn't exist or no access

**Fix:**
1. Go to **Profile** → Check GitHub connection
2. Ensure you're connected to GitHub
3. Try with a **public repository** first
4. Check repository name spelling

**Example working repo:**
```
https://github.com/OmerYasirOnal/akis-platform-devolopmenst
```

---

### Issue 3: Server Won't Start

**Error:** `Port 3000 is already in use`

**Fix:**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

### Issue 4: "Module not found: jsonwebtoken"

**Fix:**
```bash
npm install
```

---

## 🎯 Validation Checklist

Before running Scribe Agent, ensure:

- [ ] `.env.local` exists in `devagents/` directory
- [ ] `OPENROUTER_API_KEY` is set (get from https://openrouter.ai/keys)
- [ ] `GITHUB_CLIENT_ID` is set
- [ ] `GITHUB_CLIENT_SECRET` is set
- [ ] `npm run validate:env` shows "ALL CHECKS PASSED"
- [ ] Server starts without errors: `npm run dev`
- [ ] Can login and see GitHub integration in Profile
- [ ] Can see repositories in Dashboard

---

## 📞 Still Having Issues?

### Check These Logs:

**1. Server Terminal:**
```bash
# Look for errors in terminal where you ran npm run dev
```

**2. Browser Console:**
```bash
# Press F12 → Console tab
# Look for red errors
```

**3. Network Tab:**
```bash
# Press F12 → Network tab
# Check failed requests (red)
```

### Common Error Messages:

| Error | Cause | Fix |
|-------|-------|-----|
| "API key is missing" | No OPENROUTER_API_KEY | Add to `.env.local` |
| "GitHub API 404" | Wrong repo or no access | Check repo exists |
| "Port 3000 in use" | Server already running | Kill process or use different port |
| "Module not found" | Dependencies missing | Run `npm install` |

---

## 🎉 Success Indicators

When everything works correctly, you'll see:

**Server logs:**
```
[OpenRouter] ✅ Using OPENROUTER_API_KEY
[GitHub OAuth] Client ID loaded
[Scribe Agent] ✅ Repository analyzed
[Scribe Agent] ✅ Documentation generated
[Scribe Agent] ✅ PR created: https://github.com/...
```

**Browser:**
- ✅ No red errors in console
- ✅ Repository picker loads repos
- ✅ Agent shows progress logs
- ✅ Success message with PR link

---

## 📚 Additional Resources

- **Environment Setup:** `docs/ENV_SETUP.md`
- **Full Template:** `docs/ENV_LOCAL_TEMPLATE.md`
- **Migration Report:** `docs/MIGRATION_REPORT.md`

---

## 🚀 Quick Commands

```bash
# Validate environment
npm run validate:env

# Start dev server (with auto-validation)
npm run dev

# Manual validation only
node scripts/validate-env.mjs
```

---

**Need more help?** Check server logs and browser console for specific error messages.

✨ **Happy coding!**

