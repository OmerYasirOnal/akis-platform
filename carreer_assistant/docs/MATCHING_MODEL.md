# Matching / Scoring Model — Detailed Design

> **Version:** 1.0.0
> **Date:** 2026-02-13

---

## 1. Overview

The scoring model assigns each discovered job a score from 0 to 100. It operates in two phases:

1. **Hard Filter** — Binary pass/fail on non-negotiable criteria (eliminates ~70% of jobs)
2. **Weighted Scoring** — 6-dimension scoring on remaining jobs

## 2. Hard Filter Rules

```typescript
type HardFilterResult = { pass: true } | { pass: false; reason: string };

// ALL must pass; first failure short-circuits
const HARD_FILTERS = [
  filterByRoleLevel,      // Must be intern/junior/entry/graduate
  filterByRoleType,       // Must be developer/engineer role
  filterByWorkModel,      // Must be remote or Istanbul hybrid
  filterByLanguage,       // Must be EN or TR
];
```

### Role Level Detection

Keywords that PASS: `intern`, `junior`, `entry-level`, `graduate`, `early career`, `0-2 years`, `stajyer`, `yeni mezun`

Keywords that FAIL: `senior`, `lead`, `principal`, `staff`, `manager`, `director`, `architect`, `head of`, `VP`, `5+ years`, `7+ years`, `10+ years`

Keywords that are NEUTRAL (don't filter): `mid`, `mid-level`, `3-5 years` (scored lower but not eliminated)

### Role Type Detection

Keywords that PASS: `developer`, `engineer`, `programmer`, `full-stack`, `fullstack`, `frontend`, `front-end`, `backend`, `back-end`, `software`, `web developer`, `yazılımcı`, `geliştirici`

Keywords that FAIL: `designer` (alone), `project manager`, `product manager`, `data scientist` (alone), `devops` (alone), `system admin`, `network engineer`

## 3. Scoring Dimensions

### 3.1 Tech Stack Match (0-30 points)

```typescript
const TECH_KEYWORDS = {
  // Tier 1: Core stack (4 points each, max 20)
  tier1: ['typescript', 'javascript', 'nodejs', 'node.js', 'react', 'reactjs'],
  // Tier 2: Extended stack (3 points each, max 15)
  tier2: ['fastify', 'drizzle', 'postgresql', 'postgres', 'vite', 'tailwind', 'tailwindcss'],
  // Tier 3: Related (1 point each, max 5)
  tier3: ['express', 'next.js', 'nextjs', 'vue', 'angular', 'sql', 'graphql', 'rest', 'api', 'docker', 'git', 'github'],
};

function scoreTechStack(jobDescription: string): number {
  let score = 0;
  // Count tier1 matches (4 pts each, cap at 20)
  // Count tier2 matches (3 pts each, cap at 15)
  // Count tier3 matches (1 pt each, cap at 5)
  // Return min(score, 30)
}
```

### 3.2 AI/Agent Keywords (0-20 points)

```typescript
const AI_KEYWORDS = {
  // High value (6 points each, max 18)
  high: ['ai agent', 'agentic', 'llm', 'large language model', 'copilot', 'mcp'],
  // Medium value (4 points each, max 12)
  medium: ['artificial intelligence', 'machine learning', 'automation', 'workflow automation', 'chatbot'],
  // Low value (2 points each, max 6)
  low: ['openai', 'gpt', 'claude', 'langchain', 'vector', 'embedding', 'rag', 'prompt engineering'],
};

// Max capped at 20
```

### 3.3 Company Quality (0-15 points)

| Signal | Points | How to Detect |
|--------|--------|---------------|
| Known company (in curated list) | +5 | Match against `KNOWN_COMPANIES` list |
| Product company (not agency/outsourcing) | +3 | Keywords: "product", "SaaS", "platform" |
| Funded/established | +3 | Keywords: "Series A/B/C", "funded", employee count |
| Good reviews/rating | +2 | Upwork: 4.5+ stars; Freelancer: 4.5+ rating |
| Repeat client | +2 | Platform data: previous hires, payment verified |

### 3.4 Salary Info (0-10 points)

| Condition | Points |
|-----------|--------|
| Salary listed, meets/exceeds floor (50k+ TRY or equiv) | 10 |
| Salary listed, within 80-100% of floor | 7 |
| Salary listed, below floor | 3 |
| "Competitive" / "Market rate" mentioned | 5 |
| No salary information | 0 (neutral) |
| Hourly rate >= $15/hr (for remote global) | 10 |
| Hourly rate $10-15/hr | 7 |
| Hourly rate < $10/hr | 3 |

### 3.5 Application Ease (0-15 points)

| Condition | Points |
|-----------|--------|
| Quick Apply / 1-click | 15 |
| Simple form (< 5 fields) | 12 |
| Standard ATS (5-10 fields) | 8 |
| Complex ATS (> 10 fields, custom questions) | 4 |
| Requires video submission | 2 |
| Requires unpaid test/assessment | 0 |

### 3.6 Location Match (0-10 points)

| Condition | Points |
|-----------|--------|
| Fully remote, no location restriction | 10 |
| Remote, timezone overlap (UTC+3 friendly) | 9 |
| Istanbul hybrid / on-site | 7 |
| Turkey remote | 8 |
| Remote, strict timezone (US only) | 3 |
| On-site, other Turkey city | 2 |
| On-site, requires relocation | 0 (hard filter catches this) |

## 4. Score Aggregation

```typescript
function calculateTotalScore(job: NormalizedJob): ScoredJob {
  const breakdown = {
    techStack: scoreTechStack(job),         // 0-30
    aiKeywords: scoreAIKeywords(job),       // 0-20
    companyQuality: scoreCompanyQuality(job), // 0-15
    salaryInfo: scoreSalaryInfo(job),       // 0-10
    applicationEase: scoreApplicationEase(job), // 0-15
    locationMatch: scoreLocationMatch(job),  // 0-10
  };

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return {
    ...job,
    score: Math.min(total, 100),
    scoreBreakdown: breakdown,
    recommendation: total >= 70 ? 'apply' : total >= 50 ? 'consider' : 'skip',
    explanation: generateExplanation(breakdown),
  };
}
```

## 5. Explanation Generation

Every scored job gets a human-readable explanation:

```
Score: 78/100 — APPLY
━━━━━━━━━━━━━━━━━━━━
Tech Stack:    24/30  ██████████████████████████░░░░  (TS, React, Node, PostgreSQL)
AI Keywords:   12/20  ████████████████████░░░░░░░░░░  ("automation", "workflow")
Company:       12/15  ████████████████████████░░░░░░  (Product co, funded, 4.8★)
Salary:         7/10  ██████████████████████░░░░░░░░  ($20/hr listed)
Ease:          15/15  ██████████████████████████████  (Quick Apply)
Location:       8/10  ████████████████████████░░░░░░  (Remote, UTC+3 friendly)
━━━━━━━━━━━━━━━━━━━━
Strengths: Strong tech match, easy application, good company
Gaps: No AI/agent specific requirements
```

---

*Scoring model design for Career Assistant.*
