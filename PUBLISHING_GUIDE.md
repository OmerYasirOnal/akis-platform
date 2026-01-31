# Open Source Publishing Guide

This guide describes how to create a safe public version of AKIS for open-source release.

## Strategy: Separate Public Repository

**Recommended approach:** Create a new public repository rather than making this repo public.

### Why Separate Repo?
1. Keeps internal development history private
2. Easier to exclude internal docs/configs
3. Avoids accidental secret exposure from git history
4. Allows controlled subset of features for public demo

---

## Pre-Publishing Checklist

### 1. Secret Audit

Run these commands to verify no secrets are committed:

```bash
# Check for API keys patterns
grep -r "sk-[a-zA-Z0-9]" --include="*.ts" --include="*.env" . | grep -v node_modules | grep -v dist

# Check for GitHub tokens
grep -r "ghp_\|gho_\|ghs_" --include="*.ts" --include="*.env" . | grep -v node_modules

# Check for hardcoded URLs with credentials
grep -r "https://.*:.*@" --include="*.ts" . | grep -v node_modules
```

**Expected:** Only placeholder examples or redaction code.

### 2. Files to INCLUDE in Public Pack

```
/README.md              # Public-facing overview
/LICENSE                # MIT license
/CONTRIBUTING.md        # Contribution guidelines
/CODE_OF_CONDUCT.md     # Community standards
/SECURITY.md            # Security policy
/.env.example           # Environment template (no real values)
/frontend/              # Full frontend code
/backend/               # Full backend code (sanitized)
/mcp-gateway/           # MCP Gateway code
/docs/                  # Public documentation subset
  - DEV_SETUP.md
  - ENV_SETUP.md
  - GITHUB_MCP_SETUP.md
  - INDEX.md
  - TESTING.md
```

### 3. Files to EXCLUDE from Public Pack

```
/.env                   # Never commit
/.env.local             # Never commit
/.env.mcp.local         # Never commit
/docs/archive/          # Internal history
/docs/ops/              # Internal operations
/docs/qa/               # Internal QA evidence
/.cursor/               # IDE-specific configs
/AKIS_UI_Audit_Report.* # Internal audit files
/UI_QA_REPORT.md        # Internal QA tracking
```

### 4. Environment Files

Ensure `.env.example` contains only placeholders:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/akis

# AI Providers (get your own keys)
OPENAI_API_KEY=sk-your-key-here
OPENROUTER_API_KEY=your-key-here

# GitHub OAuth (create your own app)
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret

# JWT Secret (generate unique)
JWT_SECRET=generate-a-secure-random-string
```

---

## Creating the Public Repository

### Step 1: Prepare Export

```bash
# Clone fresh copy
git clone --depth=1 https://github.com/OWNER/akis-private.git akis-public

# Remove git history
cd akis-public
rm -rf .git

# Remove excluded files
rm -rf docs/archive docs/ops docs/qa .cursor
rm -f .env .env.* UI_QA_REPORT.md AKIS_UI_Audit_Report.*

# Initialize new repo
git init
git add .
git commit -m "Initial public release"
```

### Step 2: Create GitHub Repo

1. Go to GitHub → New Repository
2. Name: `akis` or `akis-platform`
3. Visibility: Public
4. No README (we have one)

### Step 3: Push

```bash
git remote add origin https://github.com/OWNER/akis.git
git push -u origin main
```

---

## Post-Publishing

1. **Enable branch protection** on main
2. **Add topics:** `ai-agents`, `documentation`, `typescript`, `react`
3. **Set up Discussions** for community questions
4. **Configure Actions** for CI on PRs
5. **Add social preview** image

---

## License

AKIS is released under the MIT License. See [LICENSE](LICENSE) for details.
