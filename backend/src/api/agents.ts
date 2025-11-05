import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AgentOrchestrator } from '../core/orchestrator/AgentOrchestrator';
import { AgentType } from '../core/contracts/AgentContract';

const runAgentSchema = z.object({
  type: z.enum(['scribe', 'trace', 'proto']),
  context: z.object({}).passthrough().default({}),
});

export async function agentsRoutes(app: FastifyInstance) {
  const orchestrator = new AgentOrchestrator();

  app.post('/agents/run', async (req, reply) => {
    const parsed = runAgentSchema.parse(req.body);
    const result = await orchestrator.runAgent(parsed.type as AgentType, parsed.context);
    return reply.send(result);
  });
}


