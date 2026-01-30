import { FastifyInstance } from 'fastify';
import { jobEventBus, type JobEvent } from '../core/events/JobEventBus.js';
import { db } from '../db/client.js';
import { jobs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const TERMINAL_STATES = new Set(['completed', 'failed']);

export async function jobEventsRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/agents/jobs/:id/stream',
    {
      schema: {
        description: 'SSE stream for job progress events',
        tags: ['agents'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const [job] = await db.select({ state: jobs.state }).from(jobs).where(eq(jobs.id, id)).limit(1);
      if (!job) {
        return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Job not found' } });
      }

      // Access raw Node.js response for SSE
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (reply as any).raw as import('http').ServerResponse;
      raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });

      const sendEvent = (event: JobEvent) => {
        raw.write(`data: ${JSON.stringify(event)}\n\n`);
      };

      const history = jobEventBus.getHistory(id);
      for (const event of history) {
        sendEvent(event);
      }

      if (TERMINAL_STATES.has(job.state)) {
        const phase = job.state === 'completed' ? 'done' : 'error';
        sendEvent({ phase, message: `Job ${job.state}`, ts: new Date().toISOString() });
        raw.end();
        return;
      }

      const onEvent = (event: JobEvent) => {
        sendEvent(event);
        if (event.phase === 'done' || event.phase === 'error') {
          cleanup();
        }
      };

      const keepAlive = setInterval(() => {
        raw.write(': keepalive\n\n');
      }, 15_000);

      const cleanup = () => {
        clearInterval(keepAlive);
        jobEventBus.unsubscribe(id, onEvent);
        raw.end();
      };

      jobEventBus.subscribe(id, onEvent);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((request as any).raw as import('http').IncomingMessage).on('close', cleanup);
    }
  );
}
