# Prompt: Drizzle schema, initial migration, and job recording helper

1) Ensure `src/db/schema.ts` exists with `agent_runs` table (see scaffold step).
2) Generate and run migrations:
```bash
npm run db:generate
npm run db:migrate

	3.	(Optional) Add a tiny helper to record runs:
// src/db/runs.ts

import { db } from './client.js';
import { agent_runs } from './schema.js';
import { sql } from 'drizzle-orm';
import crypto from 'node:crypto';

function nanoid(size = 21) {
  return crypto.randomBytes(size).toString('base64url').slice(0, size);
}

export async function recordRunStart(agentType: string, input: any) {
  const id = nanoid();
  await db.insert(agent_runs).values({ id, agentType, status: 'running', input });
  return id;
}
export async function recordRunFinish(id: string, status: 'completed'|'failed', output?: any, error?: string) {
  await db.update(agent_runs)
    .set({ status, output, error, finishedAt: new Date() })
    .where(sql`${agent_runs.id} = ${id}`);
}

	4.	(Later) Wire these helpers into Orchestrator or individual agents.

Deliverables: Migration folder created (/drizzle), DB reachable, migrations applied successfully.
