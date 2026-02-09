/**
 * Feedback API - Platform feedback capture for pilot users
 * POST /api/feedback - Submit platform feedback (text + rating + page context)
 * S0.5.1-WL-3
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { db } from '../db/client.js';
import { feedback } from '../db/schema.js';
import { requireAuth } from '../utils/auth.js';
import { validateFeedback } from '../utils/feedback-validation.js';

export async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/feedback',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);

        const result = validateFeedback(request.body);
        if (!result.valid) {
          return reply.code(400).send({
            error: { code: 'VALIDATION_ERROR', message: result.error },
          });
        }

        const { rating, message, page } = result.data;

        const [inserted] = await db
          .insert(feedback)
          .values({
            userId: user.id,
            rating,
            message,
            page: page ?? null,
          })
          .returning({ id: feedback.id, createdAt: feedback.createdAt });

        return reply.code(201).send({
          id: inserted.id,
          createdAt: inserted.createdAt,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({
            error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          });
        }
        throw err;
      }
    }
  );
}
