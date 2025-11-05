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

Required:
- `DATABASE_URL` - PostgreSQL connection string

Optional (for features):
- `GITHUB_APP_ID`, `GITHUB_INSTALLATION_ID`, `GITHUB_APP_PRIVATE_KEY_PEM` - GitHub integration
- `ATLASSIAN_ORG_ID`, `ATLASSIAN_API_TOKEN`, `ATLASSIAN_EMAIL` - Atlassian integration
- `AI_API_KEY` - AI service API key

## Database Pool Configuration

The database client uses conservative pooling for OCI Free Tier:
- Max connections: 10
- Configured in `src/db/client.ts`

