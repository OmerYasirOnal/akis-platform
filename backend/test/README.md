# AKIS Backend Test Suite

Tests for AKIS Backend using Node's built-in test runner (`node:test`) with TypeScript via `tsx`.

## Test Structure

```
test/
├── unit/                       # Unit tests (no DB required)
│   ├── AgentStateMachine.test.ts
│   ├── AIService.test.ts
│   └── StaticCheckRunner.test.ts
├── integration/                # Integration tests (may require DB)
│   └── health.test.ts
├── smoke.jobs.test.ts         # Smoke tests for job flow
├── ai-pipeline.test.ts        # AI pipeline tests
├── jobs.list.test.ts          # Job listing tests
├── mcp.contract.test.ts       # MCP contract tests
├── observability.test.ts      # Observability tests
└── README.md
```

## Requirements

- **Node.js 20+** with built-in test runner
- **tsx** for TypeScript execution
- **DATABASE_URL** (optional, only for DB-dependent tests)

## Running Tests

```bash
# Run all tests
pnpm test

# Run with explicit DATABASE_URL (for integration tests)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/akis_v2" pnpm test

# Run in CI mode
pnpm test:ci
```

## Test Categories

### Unit Tests (`test/unit/`)

No external dependencies required. Tests pure logic:

- **AgentStateMachine**: FSM state transitions
- **AIService**: Model selection, mock service behavior
- **StaticCheckRunner**: Check result formatting

### Integration Tests (`test/integration/`)

May require external services:

- **health.test.ts**: Health, ready, version endpoints

### Smoke Tests (root `test/`)

End-to-end smoke tests for critical paths:

- **smoke.jobs.test.ts**: Job submission and retrieval flow

## Writing Tests

Use Node.js built-in test runner:

```typescript
import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('MyFeature', () => {
  test('should do something', () => {
    assert.strictEqual(1 + 1, 2);
  });

  test('async test', async () => {
    const result = await someAsyncFunction();
    assert.ok(result);
  });
});
```

### Fastify Integration Tests

Use `fastify.inject()` for HTTP tests:

```typescript
import { buildApp } from '../src/server.app.js';

const app = await buildApp();

const response = await app.inject({
  method: 'GET',
  url: '/health',
});

assert.strictEqual(response.statusCode, 200);

await app.close();
```

## Skipping DB-Dependent Tests

Tests that require database automatically skip if `DATABASE_URL` is not set:

```typescript
const hasDatabase = !!process.env.DATABASE_URL;

test('DB test', { skip: !hasDatabase }, async () => {
  // This test skips if no DATABASE_URL
});
```

## Test Coverage

Current test coverage includes:

| Component | Test File | Coverage |
|-----------|-----------|----------|
| AgentStateMachine | `unit/AgentStateMachine.test.ts` | State transitions, lifecycle |
| AIService | `unit/AIService.test.ts` | Factory, mock behavior, interfaces |
| StaticCheckRunner | `unit/StaticCheckRunner.test.ts` | Result formatting |
| Health endpoints | `integration/health.test.ts` | /health, /ready, /version |
| Job flow | `smoke.jobs.test.ts` | Create, start, get jobs |

## CI Integration

Tests run in GitHub Actions CI:

```yaml
- name: Run tests
  run: pnpm test
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

Unit tests always run. Integration tests require `DATABASE_URL` secret.
