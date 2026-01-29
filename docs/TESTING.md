# AKIS Platform Testing Guide

> **Purpose:** Comprehensive testing strategy and practical execution guide  
> **Created:** 2026-01-29  
> **Status:** Active

---

## Quick Reference

| Test Type | Command | Location | Coverage Target |
|-----------|---------|----------|----------------|
| Backend Unit | `pnpm --filter backend test` | `backend/src/**/*.test.ts` | >70% |
| Frontend Unit | `pnpm --filter frontend test` | `frontend/src/**/*.test.tsx` | >60% |
| Backend E2E | `pnpm --filter backend test:e2e` | `backend/tests/e2e/` | Critical flows |
| Type Check | `pnpm -r typecheck` | All packages | 100% (strict mode) |
| Lint | `pnpm -r lint` | All packages | Zero errors |
| Smoke Test | `./scripts/dev-smoke-jobs.sh` | Root | Critical paths |

---

## 1. Testing Philosophy

### Testing Pyramid

```
       /\
      /  \    E2E Tests (few, slow, high confidence)
     /____\
    /      \  Integration Tests (moderate, medium speed)
   /________\
  /__________\ Unit Tests (many, fast, focused)
```

### Priorities

1. **Unit Tests:** Core business logic, utilities, agents
2. **Integration Tests:** API routes, database interactions, MCP adapters
3. **E2E Tests:** Critical user flows (signup, auth, job creation)
4. **Manual QA:** UI/UX, edge cases, real-world scenarios

---

## 2. Backend Testing

### Unit Tests (Vitest)

**Location:** `backend/src/**/*.test.ts`

**What to Test:**
- Business logic in services
- Agent state machines (Job FSM: 110/110 tests)
- Utility functions
- Validation schemas (Zod)

**Example:**

```typescript
// backend/src/services/__tests__/job-service.test.ts
import { describe, it, expect } from 'vitest';
import { JobService } from '../job-service';

describe('JobService', () => {
  it('should create a Scribe job with valid payload', async () => {
    const jobService = new JobService();
    const payload = {
      type: 'scribe',
      mode: 'from_config',
      userId: 'test-user-id'
    };
    
    const job = await jobService.createJob(payload);
    
    expect(job.id).toBeDefined();
    expect(job.type).toBe('scribe');
    expect(job.state).toBe('pending');
  });
});
```

**Run:**
```bash
# All backend tests
pnpm --filter backend test

# Watch mode
pnpm --filter backend test:watch

# Coverage
pnpm --filter backend test:coverage
```

### Integration Tests

**Location:** `backend/tests/integration/`

**What to Test:**
- API endpoints with real database
- OAuth flows with mock providers
- Job execution pipelines
- MCP Gateway communication

**Setup:**
- Uses test database (`akis_test`)
- Automatic migrations before tests
- Cleanup after each test suite

**Example:**

```typescript
// backend/tests/integration/api/jobs.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestServer } from '../helpers/test-server';

describe('POST /api/agents/jobs', () => {
  let server;

  beforeAll(async () => {
    server = await createTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('should create a Scribe job with config-aware mode', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/agents/jobs',
      payload: {
        type: 'scribe',
        payload: { mode: 'from_config' }
      },
      headers: {
        cookie: 'sessionId=test-session'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('jobId');
  });
});
```

### E2E Tests

**Location:** `backend/tests/e2e/`

**What to Test:**
- Complete user journeys (signup → auth → job creation → result)
- Error recovery (network failures, AI timeouts)
- Rate limiting and quotas

**Not in Scope (see [Frontend E2E](#frontend-e2e-tests)):**
- UI interactions (handled by frontend tests)

---

## 3. Frontend Testing

### Unit Tests (Vitest + React Testing Library)

**Location:** `frontend/src/**/__tests__/`

**What to Test:**
- Component logic (hooks, state management)
- Utility functions (formatters, validators)
- Route guards and navigation

**Example:**

```typescript
// frontend/src/components/__tests__/JobCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { JobCard } from '../JobCard';

describe('JobCard', () => {
  it('should display job status correctly', () => {
    const job = {
      id: 'job-1',
      type: 'scribe',
      state: 'completed',
      createdAt: '2026-01-29T00:00:00Z'
    };

    render(<JobCard job={job} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Scribe')).toBeInTheDocument();
  });
});
```

**Run:**
```bash
# All frontend tests
pnpm --filter frontend test

# Watch mode
pnpm --filter frontend test:watch
```

### E2E Tests (Playwright)

**Status:** PLANNED (not yet implemented)

**Future Scope:**
- Signup/login flows
- Scribe job creation end-to-end
- Settings configuration

---

## 4. QA Manual Testing

### QA Evidence Documents

**Location:** `docs/qa/`

**Key Evidence Files:**
- `QA_EVIDENCE_S0.4.6.md` - Scribe Config Dashboard verification
- `QA_EVIDENCE_CURSOR_UI_RELEASE.md` - UI release checklist
- `QA_EVIDENCE_PR127_FRONTEND_GATE_FIX.md` - Frontend gate fix verification

**Evidence Template:**
```markdown
# QA Evidence: [Feature Name]

**Branch**: `feat/feature-name`
**Date**: YYYY-MM-DD
**QA Owner**: [Name]
**Status**: PASS | FAIL | PARTIAL

## Test Path 1: [Flow Name]

### Step 1: [Action]
- **Expected**: [Expected behavior]
- **Actual**: [Actual behavior]
- **Status**: PASS/FAIL
- **Evidence**: [Screenshot/log reference]
```

### Smoke Testing

**Script:** `scripts/dev-smoke-jobs.sh`

**What it Tests:**
- Backend health endpoint
- Database connectivity
- Job creation (Scribe dry-run)
- Job list retrieval

**Run:**
```bash
# From project root
./scripts/dev-smoke-jobs.sh

# Expected output:
# ✓ Backend health check passed
# ✓ Database connected
# ✓ Scribe job created (dry-run)
# ✓ Job retrieved from list
```

---

## 5. Test Data Management

### Test Database

**Name:** `akis_test`  
**Port:** Same as dev (`5433`)  
**Lifecycle:** Fresh migrations before each test suite

**Setup:**
```bash
# Create test DB
docker exec -it akis-postgres psql -U postgres -c "CREATE DATABASE akis_test;"

# Run migrations
NODE_ENV=test pnpm --filter backend db:migrate
```

### Test Fixtures

**Location:** `backend/tests/fixtures/`

**Example:**
```typescript
// backend/tests/fixtures/users.ts
export const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  emailVerified: true,
  privacyConsent: true
};

export const testScribeJob = {
  type: 'scribe',
  payload: {
    owner: 'test-owner',
    repo: 'test-repo',
    baseBranch: 'main'
  }
};
```

### Mock Data

**AI Responses:** `backend/src/providers/ai/mock-provider.ts`  
**GitHub Responses:** `backend/tests/mocks/github.ts`  
**Atlassian Responses:** `backend/tests/mocks/atlassian.ts`

---

## 6. CI/CD Integration

### GitHub Actions (Future)

**Planned Workflow:**
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        ports:
          - 5433:5432
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: akis_test

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm -r typecheck
      - run: pnpm -r lint
      - run: pnpm -r test
      - run: pnpm -r build
```

**Current Status:** Local execution only (no CI yet)

---

## 7. Local Testing Workflow

### Pre-Commit Checklist

```bash
# 1. Type check
pnpm -r typecheck

# 2. Lint
pnpm -r lint

# 3. Unit tests
pnpm --filter backend test
pnpm --filter frontend test

# 4. Build
pnpm -r build

# 5. Smoke test
./scripts/dev-smoke-jobs.sh
```

### Pre-PR Checklist

- [ ] All unit tests passing
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Smoke test passing
- [ ] QA evidence documented (if user-facing feature)
- [ ] Manual QA performed for critical flows

---

## 8. Test Coverage Goals

| Area | Current | Target | Priority |
|------|---------|--------|----------|
| Backend Core | 75% | 80% | High |
| Backend Routes | 60% | 70% | Medium |
| Frontend Components | 40% | 60% | Low |
| Job FSM | 100% | 100% | Critical |
| Agent Logic | 65% | 75% | High |

**How to Check:**
```bash
# Backend coverage
pnpm --filter backend test:coverage

# View HTML report
open backend/coverage/index.html
```

---

## 9. Common Testing Scenarios

### Testing Scribe Agent

```typescript
// backend/src/agents/__tests__/scribe-agent.test.ts
import { describe, it, expect } from 'vitest';
import { ScribeAgent } from '../scribe-agent';

describe('Scribe Agent', () => {
  it('should generate PR with contract-first approach', async () => {
    const agent = new ScribeAgent({
      aiProvider: 'mock',
      mcpGateway: 'http://localhost:4010/mcp'
    });

    const result = await agent.execute({
      owner: 'test-owner',
      repo: 'test-repo',
      baseBranch: 'main',
      targetPlatform: 'github',
      documentationPath: 'docs/'
    });

    expect(result.status).toBe('success');
    expect(result.filesUpdated).toBeGreaterThan(0);
    expect(result.prUrl).toMatch(/https:\/\/github.com\/.*\/pull\//);
  });
});
```

### Testing API Endpoints

```typescript
// backend/tests/integration/api/auth.test.ts
import { describe, it, expect } from 'vitest';
import { createTestServer } from '../helpers/test-server';

describe('POST /auth/signup/email/send-code', () => {
  it('should send verification code', async () => {
    const server = await createTestServer();

    const response = await server.inject({
      method: 'POST',
      url: '/auth/signup/email/send-code',
      payload: { email: 'test@example.com' }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('codeSent', true);
  });
});
```

### Testing Job FSM

```typescript
// backend/src/engine/__tests__/job-fsm.test.ts
import { describe, it, expect } from 'vitest';
import { JobFSM } from '../job-fsm';

describe('Job FSM State Transitions', () => {
  it('should transition from pending to running', () => {
    const fsm = new JobFSM();
    
    const job = fsm.create({ type: 'scribe' });
    expect(job.state).toBe('pending');

    const running = fsm.transition(job, 'start');
    expect(running.state).toBe('running');
  });

  it('should not allow invalid transitions', () => {
    const fsm = new JobFSM();
    const job = fsm.create({ type: 'scribe' });

    expect(() => {
      fsm.transition(job, 'complete'); // Can't complete from pending
    }).toThrow('Invalid state transition');
  });
});
```

---

## 10. Troubleshooting

### Tests Failing After DB Changes

**Problem:** "relation does not exist" errors

**Solution:**
```bash
# Reset test database
NODE_ENV=test pnpm --filter backend db:reset
NODE_ENV=test pnpm --filter backend db:migrate

# Re-run tests
pnpm --filter backend test
```

### Port Already in Use

**Problem:** Test server can't bind to port 3000

**Solution:**
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use different port in tests
TEST_PORT=3001 pnpm --filter backend test
```

### Mock AI Provider Not Working

**Problem:** Tests hitting real AI API despite `AI_PROVIDER=mock`

**Solution:**
```bash
# Ensure test environment
NODE_ENV=test pnpm --filter backend test

# Mock provider is forced in test mode (see backend/src/providers/ai/index.ts)
```

---

## 11. Related Documentation

- [DEV_SETUP.md](DEV_SETUP.md) - Development environment setup
- [ENV_SETUP.md](ENV_SETUP.md) - Environment variable configuration
- [API_USAGE.md](API_USAGE.md) - API testing examples
- [CI_AUTOMATION.md](CI_AUTOMATION.md) - CI/CD pipeline details

---

*For QA evidence templates and examples, see `docs/qa/` directory.*
