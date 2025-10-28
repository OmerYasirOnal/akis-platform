# Architecture

> This document explains the high-level structure of the AKIS DevAgents platform.

## Overview
- **Runtime/Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **AI Integration**: OpenRouter (multi-model support)
- **GitHub Integration**: GitHub App (OAuth)

## System Architecture

### Core Modules

#### 1. Authentication & Authorization (`src/lib/auth/`)
- **Actor-based system** - Unified authentication for both GitHub App and PAT
- **GitHub App integration** - Primary authentication method
- **Token management** - Secure token storage and refresh
- **Storage layer** - Client-side token persistence

Key files:
- `actor.ts` - Actor type definitions and utilities
- `github-app.ts` - GitHub App authentication logic
- `github-token.ts` - Token provider and management
- `storage.ts` - Secure token storage

#### 2. Agents System (`src/lib/agents/`)
- **Base Agent** - Abstract agent interface
- **Documentation Agent** - Automated documentation generation
- **Scribe Agent** - GitHub workflow automation
- **Playbooks** - Agent execution strategies

Agent types:
- `DocumentationAgent` - Analyzes repos and generates docs
- `ScribeAgent` - Automates PR creation and branch management

#### 3. GitHub Operations (`src/lib/github/`, `src/modules/github/`)
- **Client** - GitHub API wrapper
- **Operations** - High-level GitHub operations (branches, commits, PRs)
- **Token Provider** - Centralized token management
- **Upsert logic** - Idempotent GitHub operations

#### 4. API Routes (`src/app/api/`)

**GitHub Integration:**
- `POST /api/github/branch` - Create/checkout branches
- `GET /api/github/repos` - List accessible repositories
- `POST /api/github/connect` - Connect GitHub App
- `GET /api/github/app/installation` - Get installation details

**Agent Endpoints:**
- `POST /api/agent/scribe/run` - Execute Scribe workflow
- `POST /api/agent/documentation/analyze` - Analyze repository docs
- `POST /api/agent/documentation/generate` - Generate documentation

#### 5. UI Components (`src/components/`)
- **AgentRunPanel** - Agent execution interface
- **BranchCreator** - Branch creation UI
- **GitHubConnect** - GitHub App connection flow
- **RepoPicker** - Repository selection
- **DocumentationAgentUI** - Documentation agent controls

#### 6. Contracts & Types (`src/lib/contracts/`)
- **Shared schemas** - Zod schemas for API contracts
- **Type safety** - End-to-end type checking
- `github-branch.ts` - Branch creation contract

## Data Flow

### Documentation Generation Flow
1. User selects repository in UI
2. `DocumentationAgent` analyzes repo structure
3. Agent generates documentation artifacts
4. `ScribeAgent` creates branch and commits changes
5. GitHub API creates draft PR
6. User reviews and approves PR

### GitHub App Authentication Flow
1. User initiates GitHub App connection
2. OAuth redirect to GitHub
3. Installation callback with code
4. Token exchange and storage
5. Installation ID cached for future requests

### Branch Creation Flow
1. UI validates input (branch name, base ref)
2. POST to `/api/github/branch` with payload
3. Backend validates against Zod schema
4. GitHub operations check if branch exists (idempotent)
5. If needed, create branch from base ref SHA
6. Return result to UI

## Security Model

### Token Management
- GitHub App tokens are short-lived (1 hour)
- Tokens cached with expiry tracking
- Refresh-before-expiry strategy (5min buffer)
- Never log tokens or secrets

### API Security
- All GitHub operations require valid installation
- Rate limiting handled by GitHub API
- Error messages sanitized (no token leakage)

## Observability

### Logging
- Structured logging via `src/lib/utils/logger.ts`
- Scoped log prefixes (`[Module]` format)
- Log levels: info, warn, error
- Diagnostic endpoint: `GET /api/logs`

### Diagnostics
- `scripts/doc-proof.mjs` - Documentation coverage validation
- `scripts/link-check.mjs` - Broken link detection
- `scripts/markdown-lint.mjs` - Markdown quality checks
- `scripts/validate-env.mjs` - Environment validation

## Deployment

### Environment
- Production: Vercel (recommended)
- Development: `npm run dev` (port 3000)
- Build: `npm run build` + `npm start`

### Required Environment Variables
See `docs/ENV_SETUP.md` for full list.

## Testing Strategy

### Test Structure (`src/__tests__/`)
- **Unit tests** - Component and function tests
- **Integration tests** - API and module integration
- **E2E tests** - Full workflow tests

Key test files:
- `unit/actor.test.ts` - Actor system tests
- `unit/ui-gating.test.tsx` - UI validation tests
- `integration/scribe-app-only.test.ts` - Scribe workflow tests
- `e2e/github-app-auth.test.ts` - GitHub App auth flow

## Future Improvements

- [ ] WebSocket support for real-time agent updates
- [ ] Multi-repository batch operations
- [ ] Agent customization UI
- [ ] Enhanced DAS scoring algorithm
- [ ] Automated changelog generation

