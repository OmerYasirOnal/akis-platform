# AKIS Backend

[![CI](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml)

Fastify + TypeScript backend for AKIS Platform - Autonomous Agent System with AI-powered Plan → Execute → Reflect → Validate pipeline.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Fastify HTTP Layer                           │
│         /health  /ready  /version  /api/agents/*                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│                    AgentOrchestrator                            │
│  Plan → Execute → Reflect (tool-augmented) → Validate          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
    ┌──────────────────────┼──────────────────────┐
    ▼                      ▼                      ▼
┌────────┐          ┌────────────┐          ┌─────────┐
│ Scribe │          │   Trace    │          │  Proto  │
│ Agent  │          │   Agent    │          │  Agent  │
└────────┘          └────────────┘          └─────────┘
    │                      │                      │
    └──────────────────────┼──────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Services Layer                             │
│  AIService (OpenRouter/OpenAI) │ StaticCheckRunner │ MCP Tools │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────────┐
│              PostgreSQL (Drizzle ORM)                           │
│        jobs │ job_plans │ job_audits │ users                   │
└─────────────────────────────────────────────────────────────────┘
```

## Features

- **Three Autonomous Agents**: Scribe (docs), Trace (requirements), Proto (code)
- **Multi-Model AI Strategy**: Different models for planning, generation, validation
- **Tool-Augmented Reflection**: Static checks (lint/typecheck) integrated into LLM feedback
- **MCP Adapters**: GitHub, Jira, Confluence integration via JSON-RPC 2.0
- **FSM Job Lifecycle**: Pending → Running → Completed/Failed
- **Full Audit Trail**: All phases logged to `job_audits` table

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and AI credentials

# 3. Run database migrations
pnpm db:migrate

# 4. Start development server
pnpm dev
```

Server runs on `http://localhost:3000`.

## Local DB Migrations (Troubleshooting)

If you encounter database errors like:
```
column "plan_markdown" of relation "job_plans" does not exist
```

This means your local database schema is behind the code. **Fix:**

```bash
# Apply all pending migrations
pnpm db:migrate

# Verify columns exist (optional)
psql "$DATABASE_URL" -c "\\d job_plans"
```

**Common symptoms of schema drift:**
- Job creation returns 500 with DATABASE_ERROR
- Plan tab shows empty state even after job completes
- Backend logs show "column X does not exist"

**Prevention:** Always run `pnpm db:migrate` after pulling new code that includes migration files.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Development server with watch mode |
| `pnpm build` | Build TypeScript to JavaScript |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm test` | Run test suite |
| `pnpm db:generate` | Generate Drizzle migrations |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:studio` | Open Drizzle Studio |

## Environment Variables

See `.env.example` for complete list. Key variables:

### Important: NODE_ENV
**Do NOT set `NODE_ENV` in `.env` files.** It is controlled by scripts:
- `pnpm dev` → defaults to `development` (or uses shell env if set)
- `pnpm test` → sets `NODE_ENV=test` automatically
- `pnpm start` → expects `production` (set via shell/system env)

Setting `NODE_ENV` in `.env` can cause conflicts and validation errors.

### Required
- `DATABASE_URL` - PostgreSQL connection string

### AI Configuration
- `AI_PROVIDER` - `openrouter` | `openai` | `mock`
- `AI_API_KEY` - API key for the provider
- `AI_MODEL_DEFAULT` - Default model for generation
- `AI_MODEL_PLANNER` - Model for planning phase
- `AI_MODEL_VALIDATION` - Stronger model for validation

### GitHub MCP Server
**Required for Scribe agent to work.**

Two options:
1. **Local Docker Gateway** (Recommended):
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   ./scripts/mcp-up.sh
   ```
   Then set: `GITHUB_MCP_BASE_URL=http://localhost:4010/mcp`

2. **Remote Hosted** (requires GitHub Copilot):
   Set: `GITHUB_MCP_BASE_URL=https://api.githubcopilot.com/mcp/`

See [GitHub MCP Setup Guide](../docs/GITHUB_MCP_SETUP.md) for details.

### Optional Integrations
- `GITHUB_OAUTH_*` - GitHub OAuth for user login
- `ATLASSIAN_*` - Jira/Confluence credentials

## API Endpoints

### Health Checks
- `GET /health` → `{ "status": "ok" }`
- `GET /ready` → `{ "ready": true }` (checks DB)
- `GET /version` → `{ "version": "0.2.0" }`

### Agent Jobs
```bash
# Create job
curl -X POST http://localhost:3000/api/agents/jobs \
  -H "Content-Type: application/json" \
  -d '{"type":"scribe","payload":{"doc":"API documentation"}}'

# Response: { "jobId": "uuid", "state": "pending" }

# Get job status
curl http://localhost:3000/api/agents/jobs/<JOB_ID>
```

For complete API documentation, see [docs/API_SPEC.md](docs/API_SPEC.md).

## Agent Workflows

The system implements a **Plan → Execute → Reflect → Validate** pipeline:

1. **Plan** - AI generates execution strategy (`AI_MODEL_PLANNER`)
2. **Execute** - Agent performs task with MCP tools
3. **Reflect** - Tool-augmented critique with static check results
4. **Validate** - Optional strong model validation (`AI_MODEL_VALIDATION`)

For detailed workflow documentation, see [docs/AGENT_WORKFLOWS.md](docs/AGENT_WORKFLOWS.md).

## Testing

```bash
# Run all tests
pnpm test

# Tests include:
# - Unit: AgentStateMachine, AIService, StaticCheckRunner
# - Integration: Health endpoints, Fastify inject
```

Test coverage: 46 tests across unit and integration suites.

## Documentation

- [API Specification](docs/API_SPEC.md) - Endpoint documentation
- [Agent Workflows](docs/AGENT_WORKFLOWS.md) - Architecture and workflows
- [Test README](test/README.md) - Test suite documentation

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenRouter/OpenAI compatible APIs
- **Testing**: Node.js test runner with tsx

## OCI Free Tier Optimization

The backend is designed for resource-constrained environments:
- Conservative database pooling (max 10 connections)
- Lightweight HTTP client with retry/backoff
- Mock AI provider for development
- Efficient static check execution
