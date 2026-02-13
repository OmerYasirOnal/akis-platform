# Career Assistant

Autonomous career assistant and freelance platform orchestrator for the AKIS Platform.

## Overview

Career Assistant automates the job search and freelance work pipeline:

1. **Discover** — Scan jobs across Upwork, Freelancer, Fiverr, Bionluk, LinkedIn
2. **Score** — Rate each job 0-100 using 6-dimension weighted scoring
3. **Filter** — Hard-filter by role, location, salary; soft-rank by fit
4. **Apply** — Generate tailored proposals with AI, submit with human approval
5. **Track** — Monitor application status, client responses, interviews

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy and fill environment variables
cp .env.example .env

# Run job discovery
pnpm discover

# Score shortlisted jobs
pnpm score

# Check daily status
pnpm status
```

## Architecture

- **Core Engine** — Scoring model, hard filters, daily limits, approval gates
- **Platform Adapters** — Unified interface for Upwork (API), Freelancer (API), Fiverr (browser), Bionluk (browser), LinkedIn (browser)
- **AI Layer** — OpenAI GPT for proposal generation, cover letters, client communication
- **Notifications** — Telegram bot for real-time alerts and approval workflow
- **CLI** — Command-line tool for all operations

## Commands

| Command | Description |
|---------|-------------|
| `career discover` | Run job discovery across all platforms |
| `career score` | Score and rank discovered jobs |
| `career apply --job-id <id>` | Generate and submit application |
| `career status` | Daily status report |
| `career profile sync` | Sync profiles across platforms |

## Scoring Model

| Dimension | Weight | Signals |
|-----------|--------|---------|
| Tech Stack Match | 0-30 | JS/TS/Node/React/Fastify/Drizzle/Postgres |
| AI/Agent Keywords | 0-20 | AI, agents, automation, LLM, workflow |
| Company Quality | 0-15 | Size, funding, product focus, reviews |
| Salary Info | 0-10 | 50k+ TRY or equivalent |
| Application Ease | 0-15 | Simple form vs complex ATS |
| Location Match | 0-10 | Remote +10, Istanbul hybrid +7 |

**Thresholds:** >=70 apply, 50-69 consider, <50 skip

## Compliance

- Human approval required before every submission
- No CAPTCHA/2FA bypass
- No mass-spam messaging
- API-first approach; browser automation only where no API exists
- All actions logged in audit trail

## Documentation

- [Career Assistant Spec](docs/CAREER_ASSISTANT_SPEC.md)
- [Architecture](docs/FREELANCE_AGENT_ARCHITECTURE.md)
- [Platform Integration Analysis](docs/PLATFORM_INTEGRATION_ANALYSIS.md)
- [Application Materials](docs/APPLICATION_MATERIALS.md)
- [Scoring Model Details](docs/MATCHING_MODEL.md)

## Status

**M2+ Backlog Item** — Specification phase. Not part of S0.5 scope.
