# Platform Integration Analysis

> **Version:** 1.0.0
> **Date:** 2026-02-13
> **Status:** Research Complete

---

## 1. Upwork

### API Availability
- **Type:** GraphQL API (migrated from REST in 2024)
- **Auth:** OAuth 2.0
- **Docs:** https://www.upwork.com/developer/documentation
- **Sandbox:** Yes (test environment available)

### Available Endpoints
| Capability | Available | Notes |
|-----------|-----------|-------|
| Search jobs | Yes | GraphQL queries with filters |
| View job details | Yes | Full description, client info, budget |
| Submit proposals | Yes | With cover letter and bid amount |
| View proposals | Yes | Status tracking |
| Messaging | Yes | Client conversations |
| Profile management | Yes | Update skills, portfolio, rates |
| Contracts | Yes | Active contracts, milestones |
| Payments | Yes | View earnings, request payment |

### Rate Limits
- 100 requests per minute per access token
- 10,000 requests per day

### Legal Assessment
- **ToS Compliance:** API usage is explicitly supported and encouraged
- **Risk Level:** LOW — Official API with clear terms
- **Connects Cost:** Each proposal costs "Connects" (virtual currency, ~$0.15 each)
- **Restrictions:** No automated mass-bidding; proposals must be genuine and relevant

### Implementation Priority: P0

---

## 2. Freelancer.com

### API Availability
- **Type:** REST API (JSON)
- **Auth:** OAuth 2.0
- **Docs:** https://developers.freelancer.com/
- **Sandbox:** Yes (sandbox environment with test data)

### Available Endpoints
| Capability | Available | Notes |
|-----------|-----------|-------|
| Search projects | Yes | Filter by skills, budget, type |
| View project details | Yes | Full description, employer info |
| Place bids | Yes | With description and amount |
| View bids | Yes | Status, position |
| Messaging | Yes | Thread-based conversations |
| Profile management | Yes | Update skills, portfolio |
| Milestones | Yes | Create, request, release |
| Contests | Yes | Submit entries |

### Rate Limits
- 500 requests per minute
- No explicit daily limit documented

### Legal Assessment
- **ToS Compliance:** API usage supported; developer program available
- **Risk Level:** LOW — Official API
- **Bid Cost:** Free bids (limited per month), paid "skill tests" for credibility
- **Restrictions:** No spam bidding; bids must be relevant

### Implementation Priority: P0

---

## 3. Fiverr

### API Availability
- **Type:** Limited seller API; no public job-search API
- **Auth:** API key (seller tools only)
- **Docs:** https://developers.fiverr.com/ (limited)
- **Sandbox:** No

### Available via API
| Capability | Available | Notes |
|-----------|-----------|-------|
| Search buyer requests | No | No public endpoint |
| View gig analytics | Partial | Seller dashboard API |
| Manage orders | Partial | Order status, delivery |
| Profile management | No | Must use web UI |
| Create gigs | No | Must use web UI |
| Messaging | No | Must use web UI |

### Browser Automation Required For
- Browsing buyer requests
- Sending offers to buyer requests
- Creating and updating gigs
- Profile management
- Client messaging

### Legal Assessment
- **ToS Compliance:** Browser automation is grey area; Fiverr ToS prohibits "automated means"
- **Risk Level:** MEDIUM-HIGH — Account suspension possible
- **Mitigation:** Use conservatively, human-paced delays, human approval for all actions
- **Restrictions:** Fiverr actively detects automation; use at own risk

### Implementation Priority: P1 (conservative approach)

---

## 4. Bionluk

### API Availability
- **Type:** No public API documented
- **Auth:** N/A
- **Docs:** None found
- **Sandbox:** No

### Browser Automation Required For
- Everything (search, profile, services, messaging, orders)

### Legal Assessment
- **ToS Compliance:** No explicit automation policy found; assume restrictive
- **Risk Level:** MEDIUM — Smaller platform, less detection capability
- **Mitigation:** Manual-like behavior patterns, conservative rate limiting
- **Market:** Turkish-only platform; good for TR freelance market

### Implementation Priority: P1

---

## 5. LinkedIn

### API Availability
- **Type:** REST API (limited to approved partners)
- **Auth:** OAuth 2.0 (restricted access)
- **Docs:** https://learn.microsoft.com/en-us/linkedin/
- **Access:** Requires LinkedIn Partner Program approval (months-long process)

### Available via Partner API (if approved)
| Capability | Available | Notes |
|-----------|-----------|-------|
| Job search | Yes | But requires partner approval |
| Apply to jobs | No | Not available via API |
| Profile management | Limited | Basic profile data only |
| Messaging | No | Not available via API |
| Connections | No | Not available via API |

### Browser Automation For
- Job discovery and search
- Viewing job details
- Easy Apply (with human approval)
- Profile viewing

### Legal Assessment
- **ToS Compliance:** LinkedIn aggressively prohibits scraping (hiQ Labs v. LinkedIn case)
- **Risk Level:** HIGH — LinkedIn actively detects and bans automated accounts
- **Mitigation:** Use ONLY for discovery (read-only); never auto-apply
- **Recommendation:** Use LinkedIn job RSS feeds where available, or manual search

### Implementation Priority: P2 (discovery only, very conservative)

---

## 6. Recommended Implementation Order

### Sprint 1: API-Based Platforms
1. **Upwork** — Best API, highest value for freelance dev work
2. **Freelancer.com** — Good API, additional market coverage

### Sprint 2: Browser-Based Platforms
3. **Bionluk** — Turkish market, lower risk for browser automation
4. **Fiverr** — High value but higher risk; start with gig management only

### Sprint 3: Discovery-Only
5. **LinkedIn** — Job discovery feed only, no automation of applications

## 7. Technology Stack for Adapters

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| HTTP Client | `fetch` (Node.js built-in) | No extra dependency for API calls |
| GraphQL | Raw fetch + typed queries | Upwork GraphQL, avoid heavy client libraries |
| Browser Automation | Playwright | Industry standard, TypeScript-native, stealth capabilities |
| Browser Stealth | `playwright-extra` + stealth plugin | Avoid detection on Fiverr/LinkedIn |
| Session Storage | Local cookies file | Persist browser sessions between runs |
| Rate Limiter | Custom token bucket | Platform-specific rate limits |

---

*Platform integration analysis for Career Assistant. Updated 2026-02-13.*
