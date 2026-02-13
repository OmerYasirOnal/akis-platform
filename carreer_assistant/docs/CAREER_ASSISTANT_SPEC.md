# Career Assistant — Full Specification

> **Version:** 1.0.0
> **Date:** 2026-02-13
> **Status:** M2+ Backlog / Spike — NOT in S0.5 scope
> **Owner:** Ömer Yasir Önal

---

## 1. Problem Statement

Manual job searching across multiple freelance platforms is time-consuming, inconsistent, and prone to missed opportunities. A junior/intern developer applying to 3-5 quality jobs per day needs:

- Automated discovery across 5+ platforms
- Consistent scoring to avoid wasting time on poor-fit roles
- Tailored proposals that match each platform's style
- Human approval gates to maintain quality and compliance
- Daily discipline enforcement (limits, tracking, follow-ups)

## 2. User Constraints

| Constraint | Value |
|-----------|-------|
| Target Roles | `intern`, `junior developer`, `junior full-stack`, `junior frontend`, `junior backend` |
| Work Model | Remote (preferred), Istanbul hybrid (accepted) |
| Salary Floor (TR) | 50,000 TRY gross/month (negotiable) |
| Salary (Global/Remote) | Market-aligned for junior level, open to discussion |
| Languages | Turkish, English (both output) |
| Tech Stack | TypeScript, JavaScript, Node.js, React, Fastify, Drizzle, PostgreSQL, Vite, Tailwind |
| Bonus Keywords | AI, agents, automation, LLM, workflow, test automation, MCP |

## 3. Daily Limits

| Metric | Default | Hard Max | Notes |
|--------|---------|----------|-------|
| `max_discover_per_day` | 80 | 200 | Jobs scanned across all platforms |
| `max_shortlist_per_day` | 10 | 20 | Jobs that pass hard filter + score >= 50 |
| `max_submit_per_day` | 5 | 10 | Applications actually submitted |
| `max_outreach_per_day` | 3 | 5 | Cold DMs or connection requests |
| `max_follow_up_per_day` | 10 | 20 | Follow-up messages to existing threads |

**Enforcement:**
- Counters reset at 00:00 UTC daily
- When limit is reached, system queues remaining items for next day
- Human can override via CLI flag `--force` (logged in audit)
- All overrides require explicit confirmation

## 4. Scoring Model

### 4.1 Hard Filters (Eliminators)

Jobs failing ANY hard filter are immediately discarded (score = 0):

| Filter | Pass | Fail |
|--------|------|------|
| Role Level | Intern, Junior, Entry-level, Graduate | Senior, Lead, Principal, Staff, Manager, Director |
| Role Type | Developer, Engineer, Programmer, Full-Stack, Frontend, Backend | Designer-only, PM-only, Data Scientist, DevOps-only (unless mentions coding) |
| Work Model | Remote, Hybrid (Istanbul), Flexible | On-site outside Istanbul, Relocation required (non-IST) |
| Language | English, Turkish, Bilingual | Languages not spoken by user |

### 4.2 Weighted Scoring (0-100)

| Dimension | Weight | 0 (worst) | Max (best) | Signals |
|-----------|--------|-----------|-----------|---------|
| Tech Stack Match | 0-30 | No overlap | 5+ stack matches | JS, TS, Node, React, Fastify, Drizzle, Postgres, Vite, Tailwind |
| AI/Agent Keywords | 0-20 | None | 3+ AI keywords | "AI", "agents", "automation", "LLM", "workflow", "MCP", "copilot" |
| Company Quality | 0-15 | Unknown/spam | Well-funded product co | Company size, funding, Glassdoor/Blind ratings, product-oriented |
| Salary Info | 0-10 | Below floor | Above floor + transparent | 50k+ TRY, $, EUR equivalent; 0 if unknown (not penalized) |
| Application Ease | 0-15 | Complex multi-step ATS | Quick apply / simple form | Number of steps, required fields, custom questions |
| Location Match | 0-10 | Barely acceptable | Perfect remote match | Remote +10, Istanbul hybrid +7, other acceptable +3 |

### 4.3 Score Thresholds

| Score | Action | Label |
|-------|--------|-------|
| >= 70 | Auto-shortlist, generate proposal, send to approval | `apply` |
| 50-69 | Add to review queue, notify user for manual decision | `consider` |
| < 50 | Archive, do not surface unless user searches | `skip` |

### 4.4 Salary-Unknown Handling

When a job listing does not include salary information:

- **Scoring:** Award 0 points for salary dimension (neutral, not penalized)
- **TR roles with required salary field:** Enter "50.000+ TL gross (negotiable)"
- **TR roles without required field:** Include in cover: "Maaş beklentim pozisyona ve kapsamına göre görüşmeye açıktır."
- **Global/remote roles with required field:** Enter "Market-aligned for junior level, open to discussion"
- **Global/remote roles without required field:** Include in cover: "Salary expectations are flexible and open to discussion based on scope and location."

## 5. Human Approval Gates

The following actions ALWAYS require explicit human approval before execution:

| Action | Approval Channel | Timeout |
|--------|-----------------|---------|
| Submit job application | Telegram + CLI | 24h (auto-cancel if not approved) |
| Send client message (first contact) | Telegram + CLI | 24h |
| Accept/decline interview invitation | Telegram + CLI | 48h |
| Update platform profile | CLI only | No timeout (manual trigger) |
| Request payment / submit milestone | Telegram + CLI | No timeout |
| Create new gig/service listing | CLI only | No timeout |

**Approval Flow:**
1. System generates action + preview (proposal text, message draft, etc.)
2. Sends to Telegram with inline buttons: [Approve] [Edit] [Reject]
3. If Edit: user provides revision instructions, system regenerates
4. If Approve: system executes the action
5. If Reject: action is cancelled and logged
6. All decisions recorded in audit log with timestamp and reason

## 6. Compliance Guardrails

### 6.1 Absolute Prohibitions
- No CAPTCHA solving or bypass (automated or service-based)
- No 2FA bypass or interception
- No ToS-violating automation on any platform
- No mass-spam messaging (every message must be contextual and personalized)
- No scraping of personal data (emails, phones) from platforms
- No impersonation of other users or companies
- No fake reviews, ratings, or endorsements

### 6.2 Rate Limiting
- Respect each platform's API rate limits (with 20% safety margin)
- Browser automation: minimum 3-second delay between actions
- Maximum 1 proposal per platform per 10 minutes
- Maximum 5 profile views per platform per hour

### 6.3 Data Handling
- Platform credentials stored in local `.env` only (never committed)
- Job data cached locally in SQLite (30-day retention, then archived)
- Client conversation logs kept locally (encrypted at rest if possible)
- No data sent to third parties beyond the platforms themselves and OpenAI API

### 6.4 Platform-Specific Rules
- **Upwork:** Use official API only; respect Connects budget
- **Freelancer:** Use official API; respect bid limits per contest
- **Fiverr:** Browser automation only for profile management; manual gig creation
- **Bionluk:** Browser automation for discovery; manual application preferred
- **LinkedIn:** Browser automation for discovery only; applications via platform UI

## 7. Platform Integration

| Platform | Integration Method | Capabilities | Priority |
|----------|-------------------|-------------|----------|
| Upwork | GraphQL API (OAuth 2.0) | Search, propose, message, contracts | P0 |
| Freelancer.com | REST API (OAuth) | Search, bid, milestone, message | P0 |
| Fiverr | Browser automation | Profile mgmt, gig creation, order tracking | P1 |
| Bionluk | Browser automation | Profile mgmt, service listing, discovery | P1 |
| LinkedIn | Browser automation | Job discovery only (no auto-apply) | P2 |

## 8. Application Materials

### 8.1 CV Variants
- **Junior Full-Stack (React + Node):** Emphasizes TypeScript, Fastify, React, PostgreSQL, CI/CD
- **Junior AI/Automation:** Emphasizes agent workflows, test automation, MCP, LLM integration

### 8.2 Cover Letter Templates
- General EN (ATS-compatible)
- General TR
- Platform-specific: Upwork proposal, Fiverr gig description, Bionluk hizmet açıklaması

### 8.3 Answer Bank
- Self introduction (TR/EN, 45 seconds)
- "Why this role/company?" (TR/EN)
- Salary expectations (TR/EN with negotiation guidance)
- Technical strengths
- Weakness/growth area
- Availability and start date

## 9. Application State Machine

```
discovered
    │
    ▼
shortlisted (score >= 50)
    │
    ▼
proposal_drafted (AI-generated)
    │
    ▼
awaiting_approval (human gate)
    │
    ├── approved ──► submitted
    │                   │
    │                   ├── response_received
    │                   │       │
    │                   │       ├── interview_scheduled
    │                   │       │       │
    │                   │       │       ├── offer_received
    │                   │       │       │       │
    │                   │       │       │       ├── hired ✓
    │                   │       │       │       └── declined
    │                   │       │       │
    │                   │       │       └── rejected_after_interview
    │                   │       │
    │                   │       └── rejected
    │                   │
    │                   └── no_response (14 days → archive)
    │
    └── rejected ──► archived
```

## 10. Implementation Phases

| Phase | Scope | Status |
|-------|-------|--------|
| Phase 0 | Specification + scaffolding + templates | In Progress |
| Phase 1 | Core engine (scoring, filters, limits) | Not Started |
| Phase 2 | Platform adapters (API + browser) | Not Started |
| Phase 3 | AI integration (proposals, cover letters) | Not Started |
| Phase 4 | Notifications + approval (Telegram) | Not Started |
| Phase 5 | CLI + cron orchestration | Not Started |

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Response rate | > 15% | Responses received / applications submitted |
| Interview conversion | > 30% | Interviews / responses |
| Time to first gig | < 14 days | Days from system start to first paid work |
| Daily discipline adherence | > 90% | Days where limits respected / total days |
| Proposal quality score | > 80/100 | AI self-evaluation + client feedback |

---

*This specification is an M2+ backlog item. It does NOT expand S0.5 scope.*
