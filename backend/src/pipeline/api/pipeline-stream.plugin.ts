/**
 * Pipeline SSE stream plugin — provides real-time activity updates.
 * Mounted alongside the main pipeline plugin at /api/pipelines prefix.
 */
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { IncomingMessage, ServerResponse } from 'http';
import { pipelineBus, type PipelineActivity } from '../core/activityEmitter.js';

export interface PipelineStreamPluginOptions {
  requireAuth: (request: FastifyRequest) => Promise<{ id: string }>;
  devUserId?: string;
}

export async function pipelineStreamPlugin(
  fastify: FastifyInstance,
  opts: PipelineStreamPluginOptions,
) {
  const isDevMode = process.env.DEV_MODE === 'true';

  const authPreHandler = async (request: FastifyRequest) => {
    if (isDevMode && opts.devUserId) {
      (request as unknown as Record<string, unknown>).__pipelineUserId = opts.devUserId;
      return;
    }
    await opts.requireAuth(request);
  };

  // GET /api/pipelines/:id/stream — SSE endpoint
  fastify.get('/:id/stream', { preHandler: authPreHandler }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const raw = reply as unknown as { raw: ServerResponse };
    const reqRaw = request as unknown as { raw: IncomingMessage };

    raw.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    // Send initial connected event
    raw.raw.write(
      `data: ${JSON.stringify({ type: 'connected', pipelineId: id })}\n\n`,
    );

    const onActivity = (activity: PipelineActivity) => {
      try {
        raw.raw.write(`data: ${JSON.stringify(activity)}\n\n`);
      } catch {
        // Client disconnected
      }
    };

    pipelineBus.on(`pipeline:${id}`, onActivity);

    // Heartbeat every 15s to keep connection alive
    const heartbeat = setInterval(() => {
      try {
        raw.raw.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    reqRaw.raw.on('close', () => {
      pipelineBus.off(`pipeline:${id}`, onActivity);
      clearInterval(heartbeat);
    });

    // Tell Fastify we're handling the response ourselves
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (reply as any).hijack();
  });
}
