/**
 * Pipeline API routes — Fastify plugin.
 * Will be mounted to the Fastify server in Phase 7 (integration).
 *
 * Routes:
 *   POST   /api/pipelines              → Start a new pipeline
 *   GET    /api/pipelines              → List user's pipelines
 *   GET    /api/pipelines/:id          → Get pipeline status
 *   POST   /api/pipelines/:id/message  → Send message to Scribe
 *   POST   /api/pipelines/:id/approve  → Approve spec, start Proto
 *   POST   /api/pipelines/:id/reject   → Reject spec with feedback
 *   POST   /api/pipelines/:id/retry    → Retry failed stage
 *   POST   /api/pipelines/:id/skip-trace → Skip Trace, mark completed_partial
 *   DELETE /api/pipelines/:id          → Cancel pipeline
 */

import {
  StartPipelineRequestSchema,
  SendMessageRequestSchema,
  ApproveSpecRequestSchema,
  RejectSpecRequestSchema,
} from '../core/contracts/PipelineSchemas.js';
import type { PipelineOrchestrator } from '../core/orchestrator/PipelineOrchestrator.js';

export interface PipelineRoutesDeps {
  orchestrator: PipelineOrchestrator;
  getUserId: (request: unknown) => string;
}

export function createPipelineRoutes(deps: PipelineRoutesDeps) {
  const { orchestrator, getUserId } = deps;

  return {
    async startPipeline(request: unknown, reply: unknown) {
      const userId = getUserId(request);
      const body = StartPipelineRequestSchema.parse((request as { body: unknown }).body);
      const pipeline = await orchestrator.startPipeline(userId, {
        idea: body.idea,
        context: body.context,
        targetStack: body.targetStack,
      });
      return { pipeline };
    },

    async listPipelines(request: unknown) {
      const userId = getUserId(request);
      const pipelines = await orchestrator.listPipelines(userId);
      return { pipelines };
    },

    async getStatus(request: unknown) {
      const { id } = (request as { params: { id: string } }).params;
      const pipeline = await orchestrator.getStatus(id);
      return { pipeline };
    },

    async sendMessage(request: unknown) {
      const { id } = (request as { params: { id: string } }).params;
      const body = SendMessageRequestSchema.parse((request as { body: unknown }).body);
      const pipeline = await orchestrator.sendMessage(id, body.message);
      return { pipeline };
    },

    async approveSpec(request: unknown) {
      const { id } = (request as { params: { id: string } }).params;
      const body = ApproveSpecRequestSchema.parse((request as { body: unknown }).body);
      const pipeline = await orchestrator.approveSpec(id, body.repoName, body.repoVisibility, body.spec);
      return { pipeline };
    },

    async rejectSpec(request: unknown) {
      const { id } = (request as { params: { id: string } }).params;
      const body = RejectSpecRequestSchema.parse((request as { body: unknown }).body);
      const pipeline = await orchestrator.rejectSpec(id, body.feedback);
      return { pipeline };
    },

    async retryStage(request: unknown) {
      const { id } = (request as { params: { id: string } }).params;
      const pipeline = await orchestrator.retryStage(id);
      return { pipeline };
    },

    async skipTrace(request: unknown) {
      const { id } = (request as { params: { id: string } }).params;
      const pipeline = await orchestrator.skipTrace(id);
      return { pipeline };
    },

    async cancelPipeline(request: unknown) {
      const { id } = (request as { params: { id: string } }).params;
      const pipeline = await orchestrator.cancelPipeline(id);
      return { pipeline };
    },
  };
}
