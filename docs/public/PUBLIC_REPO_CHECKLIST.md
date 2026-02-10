# Public Portfolio Repo — Creation Checklist

> Step-by-step guide to create and maintain the public `akis-platform` repo.

## Prerequisites

- [ ] `docs/public/assets/` contains screenshots per [`SHOTLIST.md`](assets/SHOTLIST.md)
- [ ] `docs/PUBLIC_PORTFOLIO.md` is up to date with current metrics
- [ ] Main branch is clean (`git status` shows no uncommitted changes)

## Step 1: Run Export Script

```bash
# From devagents/ root
./scripts/public-repo/export.sh
```

This will:
1. Create `dist/public-repo/` with allowlisted files
2. Generate `README.md` from the public portfolio template
3. Add `LICENSE` (MIT) and `SECURITY.md`
4. Run denylist scan for secrets/internal details
5. Print a summary of exported files

**If the scan fails:** Fix the flagged file, then re-run.

## Step 2: Review Output

```bash
# Check what was exported
find dist/public-repo -type f | head -50

# Spot-check a few files for internal references
grep -r "staging.akisflow.com" dist/public-repo/ || echo "Clean"
grep -r "192.168\|10.0\|172.1[6-9]" dist/public-repo/ || echo "Clean"
grep -r "STAGING_HOST\|STAGING_SSH" dist/public-repo/ || echo "Clean"
```

## Step 3: Create Public Repo

```bash
# Option A: Fresh repo from export directory
cd dist/public-repo
git init
git add .
git commit -m "Initial commit — AKIS Platform portfolio showcase"
gh repo create OmerYasirOnal/akis-platform --public \
  --description "AI Agent Orchestration System for Software Development" \
  --source . --push
```

```bash
# Option B: Push to existing repo
cd dist/public-repo
git init
git remote add origin https://github.com/OmerYasirOnal/akis-platform.git
git add .
git commit -m "Update portfolio snapshot"
git push -u origin main --force
```

## Step 4: Add Screenshots

> **Note:** Cursor/AI cannot take screenshots. This must be done manually.
> See the full shot list: [`docs/public/assets/SHOTLIST.md`](assets/SHOTLIST.md)

1. Open [staging.akisflow.com](https://staging.akisflow.com) (viewport 1440×900)
2. Capture the 8 shots listed in `SHOTLIST.md` (landing hero, capabilities, signup, login, dashboard, agent console, job detail, agents hub)
3. Save as PNG (< 500KB each) to `docs/public/assets/` in the **private** repo
4. Re-run `./scripts/public-repo/export.sh` to include them in the public snapshot
5. Push the updated public repo

## Step 5: Verify Public Repo

- [ ] Visit `github.com/OmerYasirOnal/akis-platform` — README renders correctly
- [ ] Architecture diagram displays properly
- [ ] No `.env`, secrets, or internal IPs visible in any file
- [ ] Links to `staging.akisflow.com` work
- [ ] "About" section has description + website URL + topics

### Recommended GitHub Topics
`ai`, `agent`, `orchestration`, `typescript`, `react`, `fastify`, `mcp`, `devtools`, `automation`, `thesis`

## Updating the Public Repo

When the private repo has meaningful changes:

```bash
# 1. Update docs/PUBLIC_PORTFOLIO.md with new metrics
# 2. Re-run export
./scripts/public-repo/export.sh
# 3. Push updated snapshot
cd dist/public-repo
git add . && git commit -m "Update snapshot — <what changed>"
git push
```

**Rule:** Never manually edit files in the public repo. Always export from private → public.
