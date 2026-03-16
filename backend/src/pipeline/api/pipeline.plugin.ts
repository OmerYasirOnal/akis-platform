/**
 * Pipeline Fastify plugin — mounts all /api/pipelines routes.
 * Bridges the pipeline orchestrator to the main Fastify server.
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createPipelineRoutes } from './pipeline.routes.js';
import type { PipelineOrchestrator } from '../core/orchestrator/PipelineOrchestrator.js';
import { ZodError } from 'zod';

export interface PipelinePluginOptions {
  orchestrator: PipelineOrchestrator;
  requireAuth: (request: FastifyRequest) => Promise<{ id: string }>;
  devUserId?: string;
}

export async function pipelinePlugin(
  fastify: FastifyInstance,
  opts: PipelinePluginOptions,
) {
  const { orchestrator, requireAuth, devUserId } = opts;
  const isDevMode = process.env.DEV_MODE === 'true';

  const routes = createPipelineRoutes({
    orchestrator,
    getUserId: (request: unknown) => {
      return ((request as Record<string, unknown>).__pipelineUserId as string) ?? '';
    },
  });

  // Auth preHandler — dev mode bypass or real auth
  const authPreHandler = async (request: FastifyRequest) => {
    if (isDevMode && devUserId) {
      (request as unknown as Record<string, unknown>).__pipelineUserId = devUserId;
      return;
    }
    const user = await requireAuth(request);
    (request as unknown as Record<string, unknown>).__pipelineUserId = user.id;
  };

  // Pipeline-scoped error handler: catches ZodError from pipeline's own zod module
  // (backend global handler uses a different zod instance due to pnpm hoisting)
  // Also catches orchestrator domain errors (invalid stage, not found) as 4xx
  fastify.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.errors,
        },
        requestId: request.id,
      });
    }

    // Orchestrator domain errors → 400 or 404
    const msg = error.message ?? '';
    if (msg.startsWith('Pipeline not found')) {
      return reply.code(404).send({
        error: { code: 'NOT_FOUND', message: msg },
        requestId: request.id,
      });
    }
    if (msg.startsWith('Invalid stage') || msg.startsWith('Cannot cancel') || msg.startsWith('Cannot skip')) {
      return reply.code(400).send({
        error: { code: 'INVALID_STAGE', message: msg },
        requestId: request.id,
      });
    }

    // Delegate to parent (global) error handler
    throw error;
  });

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

  // GET /api/pipelines/:id/files-all — get all file contents for StackBlitz embed
  fastify.get('/:id/files-all', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    return routes.getAllFiles(request);
  });

  // GET /api/pipelines/:id/files/* — get file content from stored pipeline data
  fastify.get('/:id/files/*', { preHandler: authPreHandler }, async (request: FastifyRequest) => {
    return routes.getFileContent(request);
  });
}
