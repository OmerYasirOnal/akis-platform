# Prompt: Scaffold Fastify + Drizzle Modular Monolith (AKIS v2)

Goal: Initialize a TypeScript Fastify server with Drizzle + PostgreSQL, aligned to the directory contract in `.cursor/rules/cursorrules.mdc`.

## Steps
1) Initialize project & deps:
```bash
npm init -y
npm pkg set type="module"
npm i fastify @fastify/cors @fastify/helmet @fastify/sensible zod dotenv pino pino-pretty drizzle-orm drizzle-kit pg
npm i -D typescript @types/node tsx vitest supertest eslint @eslint/js typescript-eslint
npx tsc --init

	2.	Update tsconfig.json:

	•	"target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler", "strict": true, "outDir": "dist", "rootDir": "src", "esModuleInterop": true, "skipLibCheck": true, "resolveJsonModule": true.

	3.	Add scripts in package.json:

{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p .",
    "start": "node dist/server.js",
    "test": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push"
  }
}

	4.	Create directory skeleton:

src/
  server.ts
  api/
    index.ts
    health.ts
  config/
    index.ts
  db/
    client.ts
    schema.ts
  core/
    orchestrator/AgentOrchestrator.ts
    agents/IAgent.ts
    agents/BaseAgent.ts
    agents/AgentFactory.ts
    state/AgentStateMachine.ts
    contracts/AgentContract.ts
    contracts/AgentPlaybook.ts
  agents/
    scribe/ScribeAgent.ts
    scribe/ScribePlaybook.json
  services/
    github/GitHubService.ts
    confluence/ConfluenceService.ts
    jira/JiraService.ts
    ai/AIService.ts
  tests/

	5.	Create drizzle.config.ts at repo root:

import 'dotenv/config';
export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL as string },
} as const;

	6.	Minimal server bootstrap (src/server.ts):

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import { registerApi } from './api/index.js';

const app = Fastify({ logger: true });
await app.register(cors);
await app.register(helmet);
await app.register(sensible);
await registerApi(app);

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

	7.	API index and health:

// src/api/index.ts
import { FastifyInstance } from 'fastify';
import health from './health.js';
export async function registerApi(app: FastifyInstance) {
  await app.register(health, { prefix: '/api' });
}
export default registerApi;

// src/api/health.ts
import { FastifyInstance } from 'fastify';
export default async function health(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true, ts: Date.now() }));
}

	8.	Config, DB client & schema stubs:

// src/config/index.ts
export const config = {
  env: process.env.NODE_ENV ?? 'development',
  databaseUrl: process.env.DATABASE_URL ?? '',
};

// src/db/client.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { config } from '../config/index.js';
const pool = new Pool({ connectionString: config.databaseUrl });
export const db = drizzle(pool);

// src/db/schema.ts
import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
export const agent_runs = pgTable('agent_runs', {
  id: text('id').primaryKey(),
  agentType: text('agent_type').notNull(),
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed'
  input: jsonb('input'),
  output: jsonb('output'),
  error: text('error'),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

	9.	Ensure .env is loaded (use .cursor/templates/.env.example as a base).
	10.	Run npm run dev and verify GET /api/health returns { ok: true }.

Deliverables: Compiles, starts, passes health check.
