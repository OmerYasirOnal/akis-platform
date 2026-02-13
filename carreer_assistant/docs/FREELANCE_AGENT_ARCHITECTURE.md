# Freelance Agent — Technical Architecture

> **Version:** 1.0.0
> **Date:** 2026-02-13
> **Status:** M2+ Design Document

---

## 1. System Overview

The Career Assistant is a standalone TypeScript module that orchestrates job discovery, scoring, proposal generation, and application management across multiple freelance platforms.

```
┌─────────────────────────────────────────────────────┐
│                    CLI / Cron                         │
├─────────────────────────────────────────────────────┤
│              Orchestration Layer                      │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │ Discovery │ │ Scoring  │ │ Approval Gate     │   │
│  │ Engine    │ │ Model    │ │ (human-in-loop)   │   │
│  └──────────┘ └──────────┘ └───────────────────┘   │
├─────────────────────────────────────────────────────┤
│              Service Layer                            │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐   │
│  │ Materials │ │ AI       │ │ Notifications     │   │
│  │ Generator │ │ Client   │ │ (Telegram)        │   │
│  └──────────┘ └──────────┘ └───────────────────┘   │
├─────────────────────────────────────────────────────┤
│              Adapter Layer                            │
│  ┌────────┐ ┌────────────┐ ┌───────┐ ┌────────┐   │
│  │ Upwork │ │ Freelancer │ │ Fiverr│ │Bionluk │   │
│  │ (API)  │ │ (API)      │ │(Brwsr)│ │(Brwsr) │   │
│  └────────┘ └────────────┘ └───────┘ └────────┘   │
├─────────────────────────────────────────────────────┤
│              Data Layer                               │
│  ┌──────────────────────────────────────────────┐   │
│  │ SQLite (jobs, applications, scores, audit)    │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## 2. Core Design Principles

1. **Adapter Pattern** — Every platform exposes the same `PlatformAdapter` interface. Adding a new platform means implementing one adapter class.
2. **Human-in-the-Loop** — No irreversible action executes without explicit human approval.
3. **FSM Lifecycle** — Every job application follows a deterministic state machine (discovered → hired/rejected).
4. **Audit Everything** — Every action, decision, and state transition is logged with timestamp and context.
5. **API-First** — Use official APIs where available; browser automation is a fallback.
6. **Cost-Aware** — Track OpenAI API costs per operation; fall back to templates when AI is unnecessary.

## 3. Adapter Interface

```typescript
interface PlatformAdapter {
  readonly platform: PlatformType;
  readonly method: 'api' | 'browser';

  initialize(): Promise<void>;
  teardown(): Promise<void>;

  searchJobs(filters: JobFilters): Promise<NormalizedJob[]>;
  getJobDetails(jobId: string): Promise<JobDetails>;
  submitProposal(jobId: string, proposal: Proposal): Promise<SubmissionResult>;

  getProfile(): Promise<PlatformProfile>;
  updateProfile(updates: ProfileUpdate): Promise<void>;

  getConversations(): Promise<Conversation[]>;
  sendMessage(conversationId: string, message: string): Promise<void>;
}
```

### 3.1 API Adapters

For platforms with official APIs (Upwork, Freelancer):
- Use OAuth 2.0 authentication
- Respect rate limits with exponential backoff
- Cache responses locally (5-minute TTL for searches)
- Map platform-specific job format to `NormalizedJob`

### 3.2 Browser Adapters

For platforms without APIs (Fiverr, Bionluk):
- Use Playwright for browser automation
- Headless mode by default; headed mode for debugging
- 3-second minimum delay between actions
- Screenshot on every critical action for audit
- Session persistence (cookies) to avoid repeated logins

## 4. Data Model

### 4.1 Core Entities

```
jobs
├── id: TEXT PRIMARY KEY (uuid)
├── platform: TEXT (upwork|freelancer|fiverr|bionluk|linkedin)
├── platform_job_id: TEXT
├── title: TEXT
├── description: TEXT
├── company_name: TEXT
├── salary_min: INTEGER (nullable)
├── salary_max: INTEGER (nullable)
├── salary_currency: TEXT (nullable)
├── work_model: TEXT (remote|hybrid|onsite)
├── location: TEXT (nullable)
├── role_level: TEXT (intern|junior|mid|senior)
├── tech_stack: TEXT (JSON array)
├── url: TEXT
├── discovered_at: TEXT (ISO 8601)
├── score: INTEGER (0-100, nullable)
├── score_breakdown: TEXT (JSON)
├── state: TEXT (FSM state)
└── archived: INTEGER (0|1)

applications
├── id: TEXT PRIMARY KEY (uuid)
├── job_id: TEXT REFERENCES jobs(id)
├── proposal_text: TEXT
├── cover_letter: TEXT (nullable)
├── submitted_at: TEXT (nullable)
├── response_at: TEXT (nullable)
├── response_type: TEXT (nullable)
├── interview_at: TEXT (nullable)
├── outcome: TEXT (nullable)
└── notes: TEXT (nullable)

daily_counters
├── date: TEXT PRIMARY KEY (YYYY-MM-DD)
├── discovered: INTEGER DEFAULT 0
├── shortlisted: INTEGER DEFAULT 0
├── submitted: INTEGER DEFAULT 0
├── outreach: INTEGER DEFAULT 0
└── follow_ups: INTEGER DEFAULT 0

audit_log
├── id: TEXT PRIMARY KEY (uuid)
├── timestamp: TEXT (ISO 8601)
├── action: TEXT
├── platform: TEXT (nullable)
├── job_id: TEXT (nullable)
├── details: TEXT (JSON)
├── outcome: TEXT (success|failure|cancelled)
└── approved_by: TEXT (nullable, human|auto)
```

## 5. AI Pipeline

```
Job Posting ──► Extraction ──► Scoring ──► Proposal Draft ──► Review ──► Submit
                    │              │              │               │
                    ▼              ▼              ▼               ▼
              NormalizedJob   Score+Explain   AI-Generated    Human Approval
                                             Proposal         via Telegram
```

### 5.1 Prompt Templates

All prompts are versioned and stored as constants:

- `EXTRACT_JOB_DATA` — Parse unstructured job posting into NormalizedJob
- `SCORE_JOB` — Evaluate job against user profile (backup for edge cases)
- `GENERATE_PROPOSAL` — Create platform-specific proposal from job + profile
- `GENERATE_COVER_LETTER` — Create cover letter from job + CV variant
- `PERSONALIZE_MESSAGE` — Adapt generic template to specific client/company
- `EVALUATE_RESPONSE` — Classify client response (interested/rejected/question)

### 5.2 Persona Engine

The PersonaEngine maintains a consistent voice across all communications:

- Writing style: concise, technical, enthusiastic but not overselling
- Tone: professional, slightly informal for freelance platforms
- Language switching: TR for Turkish companies, EN for international
- Technical depth: adjust based on job requirements
- Personality traits extracted from user's existing communications

## 6. Notification System

### 6.1 Telegram Bot

Commands:
- `/status` — Daily summary (discovered/shortlisted/submitted/responses)
- `/pending` — List actions awaiting approval
- `/approve <id>` — Approve pending action
- `/reject <id>` — Reject pending action
- `/pause` — Pause all automation
- `/resume` — Resume automation

Inline keyboards for approval:
```
New job match (Score: 85/100)
[Title] at [Company]
Remote | TypeScript, React, Node.js
───────────────────
Proposal preview: "I'm applying for..."
───────────────────
[✅ Approve] [✏️ Edit] [❌ Reject]
```

## 7. Security Considerations

- All credentials in `.env` (never committed)
- SQLite database in `data/` directory (gitignored)
- Browser sessions stored locally with encryption
- API tokens refreshed automatically where supported
- Audit log tamper-evident (append-only, hash chain optional)
- No PII stored beyond what platforms already have

## 8. Future AKIS Integration

When integrated into AKIS as a proper agent:

1. **Registration:** `AgentFactory.register('career', CareerAgent)`
2. **Playbook:** Phases: scanning → scoring → proposing → approving → submitting → tracking
3. **Contract:** Input schema (user profile + platform creds), output schema (applications + metrics)
4. **MCP Adapters:** Platform adapters could become MCP adapters under `services/mcp/adapters/`
5. **UI:** Agent console page at `/agents/career` with LiveAgentCanvas integration
6. **SSE:** Real-time job discovery and application status via JobEventBus

---

*Architecture document for Career Assistant M2+ module.*
