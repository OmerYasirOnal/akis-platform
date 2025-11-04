import type { FastifyInstance } from 'fastify';
import health from './health.js';
import { Orchestrator } from '../core/orchestrator/AgentOrchestrator.js';
import '../agents/scribe/ScribeAgent.js'; // Ensure agent is registered

export async function registerApi(app: FastifyInstance) {
  await app.register(health, { prefix: '/api' });
  
  // Register scribe route directly (plugin mechanism not working as expected)
  app.post('/api/agents/scribe/run', async (req, reply) => {
    try {
      const body = (req.body ?? {}) as any;
      const result = await Orchestrator.run('scribe', body);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
}

export default registerApi;


