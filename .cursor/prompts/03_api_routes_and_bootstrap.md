# Prompt: Wire Fastify routes to Orchestrator (Scribe run)

Add route file:
// src/api/agents/run-scribe.ts
```ts
import { FastifyInstance } from 'fastify';
import { Orchestrator } from '../../core/orchestrator/AgentOrchestrator.js';

export default async function runScribe(app: FastifyInstance) {
  app.post('/agents/scribe/run', async (req, reply) => {
    const body = (req.body ?? {}) as any;
    const result = await Orchestrator.run('scribe', body);
    return reply.send(result);
  });
}

Update API index to register:
// src/api/index.ts

import { FastifyInstance } from 'fastify';
import health from './health.js';
import runScribe from './agents/run-scribe.js';

export async function registerApi(app: FastifyInstance) {
  await app.register(health, { prefix: '/api' });
  await app.register(runScribe, { prefix: '/api' });
}
export default registerApi;

Verification:
	•	POST http://localhost:3000/api/agents/scribe/run with { "owner": "x", "repo": "y" } returns { success: true, data: ... }.
