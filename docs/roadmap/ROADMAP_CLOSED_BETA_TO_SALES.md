# AKIS Platform - Product Roadmap
## Closed Beta → Stable Production → Sellable Product

**Version:** 1.0  
**Date:** 2026-02-02  
**Status:** Active Planning Document

---

## Executive Summary

This roadmap guides AKIS Platform from closed beta to a sellable B2B product. The core value proposition remains:

> **"AKIS saves developers 5+ hours per week on documentation, test planning, and prototyping."**

### North Star Metric

**"Developer Time Saved per Week"** - measured via:
- Job completion count × average time saved per job type
- Token usage as a cost/complexity proxy
- User-reported time saved (optional survey)
- Demo completion rate for prospects

### Core Problems Solved

1. **Documentation Drift** (Scribe Agent) - Keeps docs in sync with code changes
2. **Test Coverage Gaps** (Trace Agent) - Generates test cases from requirements
3. **Slow Prototyping** (Proto Agent) - Scaffolds projects from text descriptions

---

## Phase Overview

| Phase | Focus | Timeline Target | Key Deliverable |
|-------|-------|-----------------|-----------------|
| **P0** | Stability & Environment | Immediate | Production-ready deployment |
| **P1** | Agent Standardization & Core UX | Short-term | 3 professional agents |
| **P2** | Demo Polish & GTM Prep | Medium-term | Sales-ready demo |
| **P3** | Expansion & Marketplace | Long-term | Self-serve growth |

---

## Phase P0: Stability & Environment Separation

**Goal:** Fix production-blocking issues and establish environment hygiene.

### P0 Tasks

| ID | Task | Location | Acceptance Criteria | Status |
|----|------|----------|---------------------|--------|
| P0-1 | Configure GitHub Secrets for staging | GitHub Settings → Secrets | Staging auto-deploy succeeds | Manual |
| P0-2 | Build and push MCP gateway image | `mcp-gateway/` | Health check passes at `/mcp/health` | Manual |
| P0-3 | Update staging compose for MCP | `devops/compose/docker-compose.staging.yml` | MCP service starts with main stack | Manual |
| P0-4 | Set `GITHUB_MCP_BASE_URL` in staging | Server `/opt/akis/.env` | Scribe can execute GitHub operations | Manual |
| P0-5 | Create environment documentation | `docs/ops/ENVIRONMENTS_AND_RELEASES.md` | Doc exists with all env contracts | ✅ Done |
| P0-6 | Add feature flag infrastructure | `backend/src/config/env.ts` | `FEATURE_FLAG_UNSTABLE_ROUTES` exists | ✅ Done |
| P0-7 | Fix auth cookie domain for prod | `devops/compose/docker-compose.prod.yml` | Session persists across page reloads | ✅ Done |
| P0-8 | Enhance CI smoke tests | `.github/workflows/deploy-*.yml` | Health endpoints validated with schema | ✅ Done |

### P0 Definition of Done

- [ ] Staging deployment succeeds via GitHub Actions
- [ ] MCP gateway deployed and healthy
- [ ] Scribe agent can create GitHub PRs from staging
- [ ] Production cookie sessions persist correctly
- [ ] Health check smoke tests validate response schemas

---

## Phase P1: Agent Standardization & Core UX

**Goal:** Professionalize all three core agents with explicit contracts, playbooks, and quality gates.

### P1.1 Agent Contract & Playbook Documentation

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P1-1 | Scribe Contract documentation | `backend/docs/agents/SCRIBE_CONTRACT.md` | Input/output schemas, failure modes, retries defined |
| P1-2 | Scribe Playbook documentation | `backend/docs/agents/SCRIBE_PLAYBOOK.md` | Step-by-step workflow documented |
| P1-3 | Trace Contract documentation | `backend/docs/agents/TRACE_CONTRACT.md` | Input/output schemas defined |
| P1-4 | Proto Contract documentation | `backend/docs/agents/PROTO_CONTRACT.md` | Input/output schemas defined |

### P1.2 Token/Cost Visibility

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P1-5 | Display token/cost in job detail | `frontend/src/pages/JobDetail.tsx` | `aiEstimatedCostUsd`, `aiTotalTokens` visible |
| P1-6 | Add cost tracking to job list | `frontend/src/pages/Jobs.tsx` | Cost column in jobs table |
| P1-7 | User AI key usage dashboard | `frontend/src/pages/Settings.tsx` | Show usage stats for user keys |

### P1.3 Trace Agent MVP

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P1-8 | Implement Trace planning phase | `backend/src/agents/trace/TraceAgent.ts` | Parses Jira ticket, creates test plan |
| P1-9 | Implement Trace execution phase | `backend/src/agents/trace/TraceAgent.ts` | Generates Cucumber/Jest stub files |
| P1-10 | Implement Trace reflection phase | `backend/src/agents/trace/TraceAgent.ts` | Validates generated test structure |
| P1-11 | Trace MCP adapter (Jira read) | `backend/src/services/mcp/adapters/JiraMCPService.ts` | Can read Jira ticket details |

### P1.4 Proto Agent MVP

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P1-12 | Implement Proto planning phase | `backend/src/agents/proto/ProtoAgent.ts` | Parses requirements, creates scaffold plan |
| P1-13 | Implement Proto execution phase | `backend/src/agents/proto/ProtoAgent.ts` | Generates project files from templates |
| P1-14 | Implement Proto reflection phase | `backend/src/agents/proto/ProtoAgent.ts` | Validates scaffold completeness |

### P1.5 Dashboard Improvements

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P1-15 | Job history with filters | `frontend/src/pages/Jobs.tsx` | Type/status/date filters work |
| P1-16 | Real-time job status (SSE) | `backend/src/api/job-events.ts` | Job progress updates without refresh |
| P1-17 | Job detail page enhancements | `frontend/src/pages/JobDetail.tsx` | Show planning/execution/reflection stages |

### P1 Definition of Done

- [ ] All 3 agents have contract + playbook documentation
- [ ] Token/cost displayed for every job run
- [ ] Trace agent can: Jira ticket → test case stubs
- [ ] Proto agent can: text requirements → project scaffold
- [ ] Dashboard shows real-time job progress

---

## Phase P2: Demo Polish & GTM Prep

**Goal:** Create a reliable, impressive demo flow and prepare for sales conversations.

### P2.1 Demo Flow Hardening

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P2-1 | Demo mode toggle | `frontend/src/App.tsx` | Can switch to demo mode without real auth |
| P2-2 | Pre-seeded demo data | `backend/scripts/seed-demo.ts` | Demo jobs/artifacts ready |
| P2-3 | Demo flow: Issue → PR | Demo script | Complete flow in under 60 seconds |
| P2-4 | Error recovery in demo | All agent error paths | Graceful failure messages, retry options |

### P2.2 Landing Page & Marketing

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P2-5 | Landing page CTA updates | `frontend/src/pages/Landing.tsx` | 3 agent cards with "Try Free" CTAs |
| P2-6 | Value proposition clarity | `frontend/src/pages/Landing.tsx` | "5+ hours saved per week" prominent |
| P2-7 | Agent detail pages | `frontend/src/pages/agents/*.tsx` | Each agent has dedicated marketing page |

### P2.3 Pricing & Plans

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P2-8 | Pricing page implementation | `frontend/src/pages/Pricing.tsx` | 3-tier structure displayed |
| P2-9 | Plan comparison table | `frontend/src/pages/Pricing.tsx` | Feature comparison clear |
| P2-10 | Trial/free tier limits | `backend/src/services/billing/` | Usage limits enforced |

**Proposed Pricing Tiers:**

| Tier | Price | Agents | Jobs/Month | Support |
|------|-------|--------|------------|---------|
| **Free** | $0 | Scribe only | 10 | Community |
| **Team** | $49/user/mo | All 3 | 100 | Email |
| **Enterprise** | Custom | All + custom | Unlimited | Dedicated |

### P2.4 Closed Beta Program

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P2-11 | Beta invite system | `backend/src/api/beta/` | Can generate invite codes |
| P2-12 | Feedback collection | Integration with Typeform/similar | Users can submit feedback |
| P2-13 | Changelog updates | `CHANGELOG.md` | v0.5.0 release notes complete |

### P2.5 Content Marketing

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P2-14 | LinkedIn content templates | `docs/gtm/LINKEDIN_TEMPLATES.md` | 3+ post templates ready |
| P2-15 | Case study template | `docs/gtm/CASE_STUDY_TEMPLATE.md` | Template for beta user stories |
| P2-16 | Product demo video script | `docs/gtm/DEMO_VIDEO_SCRIPT.md` | 2-minute demo script ready |

### P2 Definition of Done

- [ ] Demo completes reliably in under 60 seconds
- [ ] Landing page clearly communicates value
- [ ] Pricing page shows 3 tiers with comparison
- [ ] 3-5 beta users actively using platform
- [ ] At least 3 LinkedIn posts published
- [ ] CHANGELOG.md has v0.5.0 release notes

---

## Phase P3: Expansion & Marketplace

**Goal:** Enable self-serve growth and prepare for scale.

### P3.1 Atlassian Integration Production

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P3-1 | Atlassian OAuth flow | `backend/src/api/integrations/atlassian/` | Users can connect Jira/Confluence |
| P3-2 | Jira MCP production-ready | `backend/src/services/mcp/adapters/JiraMCPService.ts` | Create/update Jira issues |
| P3-3 | Confluence MCP production | `backend/src/services/mcp/adapters/ConfluenceMCPService.ts` | Create/update Confluence pages |

### P3.2 Usage-Based Billing

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P3-4 | Stripe metered billing | `backend/src/services/billing/` | Token usage billed monthly |
| P3-5 | Usage dashboard | `frontend/src/pages/Billing.tsx` | Users see current usage vs limits |
| P3-6 | Overage handling | `backend/src/services/billing/` | Graceful limit enforcement |

### P3.3 Self-Serve Improvements

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P3-7 | Onboarding wizard | `frontend/src/components/Onboarding/` | First job < 5 minutes from signup |
| P3-8 | In-app documentation | `frontend/src/pages/Docs/` | Contextual help available |
| P3-9 | API documentation | `docs/api/` | OpenAPI spec published |

### P3.4 Agent Marketplace Concept

| ID | Task | Location | Acceptance Criteria |
|----|------|----------|---------------------|
| P3-10 | Custom agent framework | Design doc | Architecture for user-defined agents |
| P3-11 | Agent submission process | Design doc | How users contribute agents |

### P3 Definition of Done

- [ ] Atlassian integration works in production
- [ ] Usage-based billing active for paying customers
- [ ] First-run experience < 5 minutes
- [ ] Agent marketplace design documented

---

## Metrics & KPIs

### Success Metrics by Phase

| Phase | Metric | Target |
|-------|--------|--------|
| **P0** | Deploy success rate | 100% |
| **P0** | Health check uptime | 99.9% |
| **P1** | Job completion rate | > 90% |
| **P1** | Average tokens per job | Baseline established |
| **P2** | Demo completion rate | > 95% |
| **P2** | Beta user retention | > 60% (7-day) |
| **P3** | Conversion rate | > 5% free→paid |
| **P3** | Time to first job | < 5 minutes |

### North Star Tracking

**Developer Time Saved per Week:**

| Calculation | Formula |
|-------------|---------|
| Scribe job | 30 min/job × jobs completed |
| Trace job | 45 min/job × jobs completed |
| Proto job | 60 min/job × jobs completed |
| Total | Sum of above ÷ active users |

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| AI costs exceed revenue | User-provided keys, token budgets |
| MCP gateway outages | Fallback to direct API calls |
| Database growth | Archival strategy, partitioning |

### Product Risks

| Risk | Mitigation |
|------|------------|
| Low adoption | Focus on demo quality, social proof |
| Feature creep | Strict P0/P1/P2 prioritization |
| Competition | Double down on MCP integration story |

### Operational Risks

| Risk | Mitigation |
|------|------------|
| OCI Free Tier limits | Monitor resource usage, have paid tier ready |
| Single VM failure | Database backups, Docker image registry |

---

## Appendix: File Reference

### Documentation Files
- `docs/ops/ENVIRONMENTS_AND_RELEASES.md` - Environment contracts
- `docs/reports/REALITY_AUDIT.md` - Current state analysis
- `backend/docs/Auth.md` - Authentication documentation
- `docs/UI_DESIGN_SYSTEM.md` - Design tokens and components

### Agent Files
- `backend/src/agents/scribe/ScribeAgent.ts`
- `backend/src/agents/trace/TraceAgent.ts`
- `backend/src/agents/proto/ProtoAgent.ts`
- `backend/src/core/orchestrator/AgentOrchestrator.ts`

### Configuration Files
- `backend/src/config/env.ts`
- `devops/compose/docker-compose.staging.yml`
- `devops/compose/docker-compose.prod.yml`
