/**
 * Pipeline Fastify plugin — mounts all /api/pipelines routes.
 * Bridges the pipeline orchestrator to the main Fastify server.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createPipelineRoutes } from './pipeline.routes.js';
import type { PipelineOrchestrator } from '../core/orchestrator/PipelineOrchestrator.js';

export interface PipelinePluginOptions {
  orchestrator: PipelineOrchestrator;
  requireAuth: (request: FastifyRequest) => Promise<{ id: string }>;
}

export async function pipelinePlugin(
  fastify: FastifyInstance,
  opts: PipelinePluginOptions,
) {
  const { orchestrator, requireAuth } = opts;

  const routes = createPipelineRoutes({
    orchestrator,
    getUserId: (request: unknown) => {
      // userId is attached by the preHandler hook below
      return ((request as Record<string, unknown>).__pipelineUserId as string) ?? '';
    },
  });

  // Auth preHandler — runs before every pipeline route
  const authPreHandler = async (request: FastifyRequest) => {
    const user = await requireAuth(request);
    (request as unknown as Record<string, unknown>).__pipelineUserId = user.id;
  };

  // POST /api/pipelines — start new pipeline
  fastify.post('/', { preHandler: authPreHandler }, async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await routes.startPipeline(request, reply);
    return reply.code(201).send(result);
  });

  // GET /api/pipelines — list user's pipelines
  fastify.get('/', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    return routes.listPipelines(request);
  });

  // GET /api/pipelines/:id — get pipeline status
  fastify.get('/:id', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    return routes.getStatus(request);
  });

  // POST /api/pipelines/:id/message — send message to Scribe
  fastify.post('/:id/message', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    return routes.sendMessage(request);
  });

  // POST /api/pipelines/:id/approve — approve spec
  fastify.post('/:id/approve', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    return routes.approveSpec(request);
  });

  // POST /api/pipelines/:id/reject — reject spec
  fastify.post('/:id/reject', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    return routes.rejectSpec(request);
  });

  // POST /api/pipelines/:id/retry — retry failed stage
  fastify.post('/:id/retry', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    return routes.retryStage(request);
  });

  // POST /api/pipelines/:id/skip-trace — skip trace
  fastify.post('/:id/skip-trace', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    return routes.skipTrace(request);
  });

  // DELETE /api/pipelines/:id — cancel pipeline
  fastify.route({
    method: 'DELETE',
    url: '/:id',
    preHandler: authPreHandler,
    handler: async (request: FastifyRequest) => {
      return routes.cancelPipeline(request);
    },
  });
}
