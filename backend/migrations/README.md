# Drizzle Migrations

## Commands

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

**Note:** Requires `DATABASE_URL` in `.env`. The migration will create the `jobs` table with all required columns and the `job_state` enum.

## Schema

The `jobs` table includes:
- `id` (uuid, primary key)
- `type` (varchar(50), not null)
- `state` (job_state enum: pending|running|completed|failed)
- `payload` (jsonb, nullable)
- `result` (jsonb, nullable)
- `error` (varchar(1000), nullable)
- `createdAt` (timestamp, not null)
- `updatedAt` (timestamp, not null)
