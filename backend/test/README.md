# Test Suite

Smoke tests for AKIS Backend using Node's built-in test runner and Fastify's `inject()`.

## Requirements

- **DATABASE_URL** environment variable must be set
- PostgreSQL database must be running and accessible
- Database migrations must be applied (`pnpm db:migrate`)

## Running Tests

```bash
# Set DATABASE_URL (or use .env file)
export DATABASE_URL="postgres://user:pass@localhost:5432/akis_v2"

# Run tests
pnpm test

# Or with explicit env
DATABASE_URL="postgres://..." pnpm test
```

## Test Coverage

- `GET /health` - Health check endpoint
- `GET /` - Root endpoint
- `POST /api/agents/jobs` - Create and start agent job
- `GET /api/agents/jobs/:id` - Get job status

## Notes

- Tests use Fastify's `inject()` method (no live HTTP server required)
- Tests skip automatically if `DATABASE_URL` is not set
- Database must have `jobs` table created via migrations

