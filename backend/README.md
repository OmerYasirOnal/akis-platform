# AKIS Backend

Fastify + TypeScript backend for AKIS Platform.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment:
```bash
cp .env.example .env
# Edit .env with your values (especially DATABASE_URL)
```

3. Run database migrations:
```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations to database
pnpm db:migrate
```

4. Start development server:
```bash
pnpm dev
```

Server will start on `http://localhost:3000` (default port).

## Database CLI Usage

### Generate Migration
After modifying `src/db/schema.ts`, generate a migration:
```bash
pnpm db:generate
```

This creates SQL migration files in `migrations/` directory.

### Apply Migrations
Apply pending migrations to your database:
```bash
pnpm db:migrate
```

### Drizzle Studio
Open Drizzle Studio (database GUI):
```bash
pnpm db:studio
```

## Scripts

- `pnpm dev` - Development server with watch mode
- `pnpm build` - Build TypeScript to JavaScript
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm typecheck` - TypeScript type checking
- `pnpm format` - Format code with Prettier
- `pnpm db:generate` - Generate Drizzle migrations
- `pnpm db:migrate` - Run database migrations
- `pnpm db:studio` - Open Drizzle Studio

## Environment Variables

See `.env.example` for all available environment variables.

### Required
- `DATABASE_URL` - PostgreSQL connection string

### Optional (for features)
- `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY_PEM` - GitHub integration
- `AI_API_KEY` - AI service API key

### Atlassian Integration (Conditional)

Atlassian variables (`ATLASSIAN_ORG_ID`, `ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL`) are:
- **Optional in development** (default) - Set `MCP_ATLASSIAN_ENABLED=false` (default)
- **Required in production** - Automatically enforced when `NODE_ENV=production`
- **Required when enabled** - Set `MCP_ATLASSIAN_ENABLED=true` to enable in development

**To enable Atlassian integration:**
1. Set `MCP_ATLASSIAN_ENABLED=true` in your `.env`
2. Provide all three Atlassian variables:
   - `ATLASSIAN_ORG_ID` - Your Atlassian organization ID
   - `ATLASSIAN_API_TOKEN` - API token from Atlassian account settings
   - `ATLASSIAN_EMAIL` - Valid email address (must pass email validation)

**Default behavior:**
- `MCP_ATLASSIAN_ENABLED=false` in `.env.example` (development-friendly)
- No Atlassian credentials needed to start the server in development mode

## Database Pool Configuration

The database client uses conservative pooling for OCI Free Tier:
- Max connections: 10
- Configured in `src/db/client.ts`

