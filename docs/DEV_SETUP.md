```markdown
# Developer Setup Guide

**Last Updated**: 2025-12-20  
**Target Audience**: Contributors, QA Engineers, New Developers

---

## Quick Start (5 Minutes)

```bash
# 1. Clone and install
git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
cd akis-platform-devolopment/devagents
pnpm install

# 2. Start PostgreSQL
./scripts/db-up.sh

# 3. Setup backend
cd backend
cp .env.example .env
# Edit .env: add your DATABASE_URL and GitHub token (see below)
pnpm db:migrate

# 4. Run verification (optional but recommended)
cd ..
./scripts/verify-local.sh
```

## Prerequisites

- **Node.js**: Version 20.x+ (use `nvm` or `asdf`)
- **pnpm**: Version 8.x+ (`npm install -g pnpm`)
- **Docker**: Required for running PostgreSQL
- **Docker Compose**: For managing multi-container Docker applications
- **GitHub account**: Needed for OAuth and MCP integration

## Installation Steps

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/OmerYasirOnal/akis-platform-devolopment.git
   cd akis-platform-devolopment/devagents
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```

3. **Start PostgreSQL**:
   ```bash
   ./scripts/db-up.sh
   ```

4. **Setup Backend**:
   ```bash
   cd backend
   cp .env.example .env
   nano .env  # Edit .env: add your DATABASE_URL and GitHub token
   pnpm db:migrate
   ```

5. **Run Verification (Optional)**:
   ```bash
   cd ..
   ./scripts/verify-local.sh
   ```

## Configuration

### Environment Variables

Create and edit the `.env` file in the `backend` directory with the following minimum required variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/akis_v2

# GitHub (for MCP integration)
GITHUB_TOKEN=ghp_YOUR_TOKEN_HERE  # Generate at https://github.com/settings/tokens
GITHUB_MCP_BASE_URL=http://localhost:4010/mcp

# AI (OpenAI or compatible)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Session
SESSION_SECRET=some-random-string-here

# OAuth (for authentication)
GITHUB_OAUTH_CLIENT_ID=your-client-id
GITHUB_OAUTH_CLIENT_SECRET=your-client-secret
```

### Adminer (Web UI)

To access the database via a web interface, you can run Adminer:

```bash
docker compose -f docker-compose.dev.yml up -d adminer
```

Navigate to [http://localhost:8080](http://localhost:8080) to access Adminer.

## Verification

To verify the successful installation, run:

```bash
./scripts/verify-local.sh
```

This will check if all components are working correctly.

## Troubleshooting

### Common Errors & Solutions

1. **`ECONNREFUSED 127.0.0.1:5433`**
   - **Cause**: PostgreSQL is not running.
   - **Solution**:
     ```bash
     ./scripts/db-up.sh
     ```

2. **`DATABASE_URL not set`**
   - **Cause**: Backend `.env` file is missing or incomplete.
   - **Solution**:
     ```bash
     cd backend
     cp .env.example .env
     # Edit .env and add DATABASE_URL
     ```

3. **`MCP_UNREACHABLE` in Job Details**
   - **Cause**: MCP Gateway is not running or `backend/.env` is missing `GITHUB_MCP_BASE_URL`.
   - **Solution**:
     ```bash
     ./scripts/mcp-doctor.sh
     ```

4. **Migration Error: `relation does not exist`**
   - **Cause**: Database schema is out of sync.
   - **Solution**:
     ```bash
     cd backend
     pnpm db:migrate
     ```

## End-to-End Verification

To run an end-to-end verification:

```bash
./scripts/verify-local.sh
```

---

## Next Steps

1. **Read**: `docs/PROJECT_STATUS.md` for current capabilities.
2. **Explore**: Run `./scripts/verify-local.sh` to validate your setup.
3. **Try**: Navigate to [http://localhost:5173](http://localhost:5173) and run a Scribe job.
4. **QA**: See `docs/QA_SCRIBE_AUTOMATION.md` for automated smoke/E2E workflows.
5. **Contribute**: See `CONTRIBUTING.md` for guidelines.

---

**Last Updated**: 2025-12-20  
**Maintainer**: Development Team
```