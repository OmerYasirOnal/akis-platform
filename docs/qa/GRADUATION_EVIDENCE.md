# Graduation Evidence Document — AKIS Platform

> **Task:** S0.5.3-QA-3
> **Date:** 2026-02-09
> **Student:** Ömer Yasir Onal
> **Project:** AKIS Platform — AI Agent Orchestration System
> **Milestone:** M1 Pilot Demo (28 February 2026)

---

## 1. Project Overview

**AKIS Platform** is an AI agent orchestration system designed to automate repetitive software development tasks. The platform enables developers to run specialized AI agents — Scribe (documentation), Trace (test planning), and Proto (prototyping) — through a web interface, with outputs committed as GitHub pull requests.

### Core Thesis

> *Can a structured AI agent orchestration framework improve developer productivity in documentation, testing, and prototyping tasks while maintaining output quality through automated review and critique pipelines?*

### Key Innovation

- **Agent FSM Lifecycle:** Deterministic state machine (pending → running → completed | failed) with orchestrator-controlled tool injection
- **MCP Protocol Integration:** External service access only through Model Context Protocol adapters — no direct vendor SDK coupling
- **Multi-phase AI Pipelines:** Plan → Execute → Reflect/Critique pattern for quality assurance
- **Context Packs:** Static, deterministic file bundles for agent input — debuggable and token-efficient

---

## 2. Architecture Summary

### System Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19 + Vite 7 + Tailwind 4 | SPA, no SSR |
| Backend | Fastify 4 + TypeScript | Strict mode |
| Database | PostgreSQL 16 + Drizzle ORM | OCI Free Tier |
| AI Integration | OpenAI / OpenRouter | User-provided keys, AES-256-GCM encrypted |
| External Services | MCP Protocol Adapters | GitHub via MCP gateway |
| Deployment | OCI Free Tier VM + Caddy + Docker Compose | Single VM staging |
| CI/CD | GitHub Actions | Build + typecheck + lint + test on every PR |

### Architectural Constraints (Enforced)

1. ORM: Drizzle ONLY — Prisma forbidden
2. MCP adapters ONLY at `backend/src/services/mcp/adapters/` — no direct REST SDKs
3. AgentOrchestrator owns full agent lifecycle; agents NEVER call each other
4. FSM: pending → running → completed | failed | awaiting_approval
5. TypeScript strict mode everywhere
6. i18n: all UI text in both `en.json` and `tr.json`

---

## 3. Feature Matrix

### Agents

| Agent | Purpose | Status | Golden Path Tests |
|-------|---------|--------|-------------------|
| **Scribe** | Automated documentation generation | Implemented | 12 E2E tests |
| **Trace** | Test plan and test case generation | Implemented | 10 E2E tests |
| **Proto** | Rapid prototyping / code scaffold generation | Implemented | 12 E2E tests |

### Platform Features

| Feature | Status | Evidence |
|---------|--------|----------|
| Email/Password Authentication | Done | Multi-step auth flow with verification |
| Google OAuth | Done | OAuth callback handling |
| GitHub OAuth | Done | Required for agent GitHub access |
| AI Key Management | Done | Encrypted storage, per-user keys |
| Job Lifecycle Management | Done | FSM with trace events |
| Real-time Job Logs (SSE) | Done | Server-Sent Events streaming |
| Dashboard with Getting Started | Done | 3-step onboarding checklist |
| Agents Hub | Done | Central agent discovery page |
| Job History & Detail Pages | Done | Pagination, filtering, detail view |
| Error Handling (Standardized) | Done | Error envelope with codes, 39 unit tests |
| Feedback Capture | Done | Floating widget, rating + message |
| Context Packs | Done | Static file bundles, per-agent limits |
| i18n (English + Turkish) | Done | ~500 translation keys |
| Playbook System | Done | Phase definitions per agent |
| Onboarding Flow | Done | Registration → AI key → first job |

---

## 4. Test Coverage

### Backend Tests

| Category | Count | Notes |
|----------|-------|-------|
| Unit Tests | 382 | `node:test` runner |
| Test Suites | 100 | |
| Key Areas | AI Service, Agent FSM, Scribe, Error Handling, Crypto, SSE, Trust Proxy, Email, Invite, Feedback, Context Packs, Prompt Determinism | |

### Frontend Tests

| Category | Count | Notes |
|----------|-------|-------|
| Component Tests (Vitest) | 94 | 14 test files |
| E2E Tests (Playwright) | 14 specs | Golden paths for Scribe/Trace/Proto |
| Key Areas | Dashboard, Layout, Jobs, Scribe Console, Health, API Client, Branding, Feedback, Getting Started | |

### Quality Gates (CI)

All quality gates pass on every commit:

```
pnpm -r typecheck   → 0 errors
pnpm -r lint        → 0 errors
pnpm -r build       → clean build
pnpm -r test        → 382 backend + 94 frontend = 476 tests
```

---

## 5. Codebase Metrics

| Metric | Value |
|--------|-------|
| Lines of Code (TS/TSX) | ~54,000 |
| Backend API Endpoints | ~89 |
| i18n Translation Keys | ~500 (en + tr) |
| Documentation Files | 136 |
| Database Tables | 12+ |
| Git Commits (feature branch) | 700+ |

---

## 6. Deployment & Staging

| Item | Details |
|------|---------|
| Staging URL | https://staging.akisflow.com |
| Platform | OCI Free Tier (ARM, 24GB RAM) |
| Reverse Proxy | Caddy 2 (auto TLS) |
| Containerization | Docker Compose |
| Health Endpoint | `GET /health` → `{"status":"ok"}` |
| Readiness Endpoint | `GET /ready` → service status JSON |
| Version Endpoint | `GET /version` → commit SHA |
| Smoke Test Script | `./scripts/staging_smoke.sh` (10 checks) |

---

## 7. Sprint Progress (S0.5)

| Sprint | Dates | Focus | Progress |
|--------|-------|-------|----------|
| S0.5.0 | 7-9 Feb | Staging base URL + deploy | 8/8 complete |
| S0.5.1 | 10-21 Feb | Pilot access + agent reliability | 11/11 complete |
| S0.5.2 | 10-23 Feb | Demo UX + RAG | 6/6 complete |
| S0.5.3 | 24-28 Feb | QA + demo + graduation | 3/4 complete |

**Total: 28/29 tasks complete (96.5%)**

---

## 8. Documentation Index

| Document | Purpose |
|----------|---------|
| `docs/NEXT.md` | Current sprint status (action items) |
| `docs/ROADMAP.md` | Milestones overview |
| `docs/planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md` | Canonical plan |
| `docs/agents/AGENT_CONTRACTS_S0.5.md` | Agent I/O schemas + error taxonomy |
| `docs/agents/CONTEXT_PACKS.md` | Context pack architecture decision |
| `docs/agents/SCRIBE_GOLDEN_PATH.md` | Scribe test scenarios |
| `docs/agents/TRACE_GOLDEN_PATH.md` | Trace test scenarios |
| `docs/agents/PROTO_GOLDEN_PATH.md` | Proto test scenarios |
| `docs/qa/REGRESSION_CHECKLIST.md` | 70+ regression checks |
| `docs/qa/DEMO_SCRIPT_15MIN.md` | 15-minute demo walkthrough |
| `docs/deploy/OCI_STAGING_RUNBOOK.md` | Staging operations |

---

## 9. Known Limitations

| # | Limitation | Impact | Mitigation |
|---|-----------|--------|------------|
| 1 | MCP Gateway Docker image not in CI/CD | Agents can't access GitHub on staging without manual setup | Document in runbook; planned for M2 |
| 2 | SMTP deliverability (SPF/DKIM) | Verification emails may go to spam | Manual DNS config documented |
| 3 | Single VM deployment | No horizontal scaling | Sufficient for pilot; production plan in M3 |
| 4 | Static context packs only | No dynamic search/retrieval | pg_trgm evaluation planned for March |

---

## 10. Milestones Ahead

| Milestone | Target | Focus |
|-----------|--------|-------|
| **M1: Pilot Demo** | 28 Feb 2026 | This milestone — live demo to committee |
| **M2: Stabilization** | 31 Mar 2026 | Bug fixes, pilot feedback, pg_trgm, thesis draft |
| **M3: Graduation** | May 2026 | Final report, presentation, defense, delivery package |

---

## References

- [Canonical Plan](../planning/DELIVERY_PLAN_S0.5_FEB_TO_GRADUATION.md)
- [Regression Checklist](REGRESSION_CHECKLIST.md)
- [Demo Script](DEMO_SCRIPT_15MIN.md)
- [Agent Contracts](../agents/AGENT_CONTRACTS_S0.5.md)
- [Context Packs ADR](../agents/CONTEXT_PACKS.md)
- [Staging Runbook](../deploy/OCI_STAGING_RUNBOOK.md)

---

*This document serves as evidence of project completion for the M1 Pilot Demo milestone. It will be updated as the project progresses through M2 and M3.*
