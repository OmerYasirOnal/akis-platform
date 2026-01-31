import { FastifyInstance } from 'fastify';
import { jobEventBus, type JobEvent, type StreamEvent } from '../core/events/JobEventBus.js';
import { db } from '../db/client.js';
import { jobs, jobTraces, jobArtifacts } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const TERMINAL_STATES = new Set(['completed', 'failed']);
const KEEPALIVE_INTERVAL_MS = 15_000;

/**
 * Shared SSE handler for trace-stream.
 * Extracted so we can serve it from multiple route paths.
 */
async function handleTraceStream(
  _fastify: FastifyInstance,
  request: import('fastify').FastifyRequest,
  reply: import('fastify').FastifyReply,
) {
  const { id } = request.params as { id: string };
  const query = request.query as { cursor?: string; includeHistory?: boolean };

  const lastEventIdHeader = request.headers['last-event-id'] as string | undefined;
  const cursorFromQuery = query.cursor;
  const lastEventId = lastEventIdHeader ? parseInt(lastEventIdHeader, 10) :
                      cursorFromQuery ? parseInt(cursorFromQuery, 10) : 0;
  const includeHistory = query.includeHistory !== false;

  const [job] = await db.select({
    state: jobs.state,
    type: jobs.type,
    createdAt: jobs.createdAt,
  }).from(jobs).where(eq(jobs.id, id)).limit(1);

  if (!job) {
    return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Job not found' } });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (reply as any).raw as import('http').ServerResponse;
  raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'Last-Event-ID',
  });

  const sendStreamEvent = (event: StreamEvent) => {
    raw.write(jobEventBus.formatForSSE(event));
  };

  const initEvent = jobEventBus.emitStage(id, 'init', 'started', 'Connected to trace stream');
  sendStreamEvent(initEvent);

  const streamHistory = lastEventId > 0
    ? jobEventBus.getStreamHistoryAfter(id, lastEventId)
    : jobEventBus.getStreamHistory(id);

  for (const event of streamHistory) {
    sendStreamEvent(event);
  }

  if (includeHistory && TERMINAL_STATES.has(job.state)) {
    try {
      const dbTraces = await db
        .select()
        .from(jobTraces)
        .where(eq(jobTraces.jobId, id))
        .orderBy(desc(jobTraces.timestamp))
        .limit(100);

      const currentEventId = jobEventBus.getCurrentEventId(id);
      let eventIdOffset = currentEventId;

      for (const trace of dbTraces.reverse()) {
        eventIdOffset++;
        const traceEvent: StreamEvent = {
          type: 'trace',
          eventId: eventIdOffset,
          ts: trace.timestamp?.toISOString() || new Date().toISOString(),
          jobId: id,
          eventType: trace.eventType,
          stepId: trace.stepId || undefined,
          title: trace.title,
          detail: trace.detail as Record<string, unknown> | undefined,
          durationMs: trace.durationMs || undefined,
          status: (trace.status as 'success' | 'failed' | 'warning' | 'info') || undefined,
          correlationId: trace.correlationId || undefined,
          toolName: trace.toolName || undefined,
          inputSummary: trace.inputSummary || undefined,
          outputSummary: trace.outputSummary || undefined,
          reasoningSummary: trace.reasoningSummary || undefined,
          askedWhat: trace.askedWhat || undefined,
          didWhat: trace.didWhat || undefined,
          whyReason: trace.whyReason || undefined,
        };
        sendStreamEvent(traceEvent);
      }

      const dbArtifacts = await db
        .select()
        .from(jobArtifacts)
        .where(eq(jobArtifacts.jobId, id))
        .orderBy(desc(jobArtifacts.createdAt))
        .limit(50);

      for (const artifact of dbArtifacts.reverse()) {
        eventIdOffset++;
        const artifactEvent: StreamEvent = {
          type: 'artifact',
          eventId: eventIdOffset,
          ts: artifact.createdAt?.toISOString() || new Date().toISOString(),
          jobId: id,
          kind: artifact.artifactType === 'doc_read' ? 'doc_read' :
                artifact.artifactType === 'file_created' ? 'file' :
                artifact.artifactType === 'file_modified' ? 'file' : 'file',
          label: artifact.path.split('/').pop() || artifact.path,
          path: artifact.path,
          operation: artifact.operation as 'read' | 'create' | 'modify' | 'delete' | 'preview',
          preview: artifact.preview || undefined,
          sizeBytes: artifact.sizeBytes || undefined,
        };
        sendStreamEvent(artifactEvent);
      }
    } catch (err) {
      console.error('[trace-stream] Error loading DB history:', err);
    }

    const finalStage = job.state === 'completed' ? 'completed' : 'failed';
    const doneEvent = jobEventBus.emitStage(id, finalStage, 'completed', `Job ${job.state}`);
    sendStreamEvent(doneEvent);
    raw.end();
    return;
  }

  const onStreamEvent = (event: StreamEvent) => {
    sendStreamEvent(event);
    if (event.type === 'stage' &&
        (event.stage === 'completed' || event.stage === 'failed') &&
        event.status === 'completed') {
      cleanup();
    }
  };

  const keepAlive = setInterval(() => {
    raw.write(`: keepalive ${Date.now()}\n\n`);
  }, KEEPALIVE_INTERVAL_MS);

  const cleanup = () => {
    clearInterval(keepAlive);
    jobEventBus.unsubscribeStream(id, onStreamEvent);
    raw.end();
  };

  jobEventBus.subscribeStream(id, onStreamEvent);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((request as any).raw as import('http').IncomingMessage).on('close', cleanup);
}

const traceStreamSchema = {
  description: 'SSE stream for real-time job execution trace',
  tags: ['agents'],
  params: {
    type: 'object' as const,
    required: ['id'],
    properties: {
      id: { type: 'string' as const, format: 'uuid' },
    },
  },
  querystring: {
    type: 'object' as const,
    properties: {
      cursor: { type: 'string' as const, description: 'Event ID to resume from' },
      includeHistory: { type: 'boolean' as const, description: 'Include DB-persisted trace history', default: true },
    },
  },
};

export async function jobEventsRoutes(fastify: FastifyInstance) {
  /**
   * Legacy SSE endpoint (backward compatibility)
   * Uses old JobEvent format with phase/message
   */
  fastify.get(
    '/api/agents/jobs/:id/stream',
    {
      schema: {
        description: 'SSE stream for job progress events (legacy)',
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
      }, KEEPALIVE_INTERVAL_MS);

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

  /**
   * Canonical SSE endpoint for real-time execution trace
   */
  fastify.get(
    '/api/agents/jobs/:id/trace-stream',
    { schema: traceStreamSchema },
    async (request, reply) => handleTraceStream(fastify, request as any, reply),
  );

  /**
   * Alias: /api/jobs/:id/trace-stream (canonical short path)
   */
  fastify.get(
    '/api/jobs/:id/trace-stream',
    { schema: { ...traceStreamSchema, description: 'SSE trace stream (alias)' } },
    async (request, reply) => handleTraceStream(fastify, request as any, reply),
  );

  /**
   * Alias: /agents/jobs/:id/trace-stream (backward compat — no /api prefix)
   * Catches requests from misconfigured clients
   */
  fastify.get(
    '/agents/jobs/:id/trace-stream',
    { schema: { ...traceStreamSchema, description: 'SSE trace stream (legacy alias)' } },
    async (request, reply) => handleTraceStream(fastify, request as any, reply),
  );
}
