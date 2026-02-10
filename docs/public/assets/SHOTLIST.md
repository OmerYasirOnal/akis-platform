# Screenshot Shot List

> Recommended screenshots for the public portfolio repo.
> Cursor cannot capture these — take them manually from staging.akisflow.com.

## How to capture

1. Open [staging.akisflow.com](https://staging.akisflow.com) in Chrome
2. Set viewport to **1440×900** (desktop) for consistency
3. Use DevTools → Device toolbar for mobile shots if needed
4. Save as PNG, max width 1200px, < 500KB per file
5. Place files in `docs/public/assets/` in the **private** repo
6. Run `./scripts/public-repo/export.sh` to include them in the public snapshot

## Shot List

| # | Filename | What to Capture | Page/Route |
|---|----------|----------------|------------|
| 1 | `landing-hero.png` | Landing page hero section with logo, headline, and CTA buttons | `/` |
| 2 | `landing-capabilities.png` | Capabilities cards section (4 cards: Agents, Orchestration, Quality, MCP) | `/` (scroll down) |
| 3 | `signup-onboarding.png` | Signup form or onboarding first step | `/signup` |
| 4 | `oauth-login.png` | Login page showing GitHub + Google OAuth buttons | `/login` |
| 5 | `dashboard-overview.png` | Main dashboard with Getting Started card and recent jobs | `/dashboard` |
| 6 | `agent-console-scribe.png` | Scribe agent console — ideally mid-run with SSE timeline | `/agents/scribe` |
| 7 | `job-detail-timeline.png` | Job detail page showing step timeline + plan view | `/dashboard/jobs/:id` |
| 8 | `agent-hub.png` | Agents Hub page showing all 3 agent cards | `/agents` |

## Optional (nice to have)

| # | Filename | What to Capture |
|---|----------|----------------|
| 9 | `demo.gif` | Animated GIF: start Scribe → watch SSE → see PR link (~15s) |
| 10 | `mobile-dashboard.png` | Dashboard on mobile viewport (375×812) |
| 11 | `dark-light-comparison.png` | Side-by-side dark/light theme comparison |

## After capturing

1. Verify no sensitive data is visible (emails, tokens, private repos)
2. Blur or crop any real user data if present
3. Commit to private repo: `git add docs/public/assets/ && git commit -m "docs: add portfolio screenshots"`
4. Re-run export: `./scripts/public-repo/export.sh`
5. Push updated public repo
