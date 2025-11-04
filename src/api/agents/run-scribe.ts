import type { FastifyInstance } from 'fastify';
import { Orchestrator } from '../../core/orchestrator/AgentOrchestrator.js';
import '../../agents/scribe/ScribeAgent.js'; // Ensure agent is registered

export default async function runScribe(app: FastifyInstance) {
  app.post('/agents/scribe/run', async (req, reply) => {
    try {
      const body = (req.body ?? {}) as any;
      const result = await Orchestrator.run('scribe', body);
      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ success: false, error: error.message });
    }
  });
}


