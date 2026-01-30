/**
 * Billing API routes
 * - GET /api/billing/plan — current user plan + usage
 * - GET /api/billing/plans — all available plans
 * - POST /api/billing/checkout — create Stripe checkout session
 * - POST /api/billing/portal — create Stripe customer portal session
 * - POST /api/webhooks/stripe — Stripe webhook handler
 */
import { FastifyInstance } from 'fastify';
import { requireAuth } from '../utils/auth.js';
import { formatErrorResponse } from '../utils/errorHandler.js';
import {
  getUserPlan,
  getUsageSummary,
  getAvailablePlans,
} from '../services/billing/BillingService.js';
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhookEvent,
} from '../services/billing/StripeService.js';
import { getEnv } from '../config/env.js';

export async function billingRoutes(fastify: FastifyInstance) {
  // GET /api/billing/plan — current user's plan and usage
  fastify.get('/api/billing/plan', async (request, reply) => {
    try {
      const user = await requireAuth(request);
      const [plan, usage] = await Promise.all([
        getUserPlan(user.id),
        getUsageSummary(user.id),
      ]);

      return reply.send({ plan, usage });
    } catch (error) {
      const errorResponse = formatErrorResponse(request, error);
      return reply.code(401).send(errorResponse);
    }
  });

  // GET /api/billing/plans — all available plans
  fastify.get('/api/billing/plans', async (_request, reply) => {
    const allPlans = await getAvailablePlans();
    return reply.send({ plans: allPlans });
  });

  // POST /api/billing/checkout — create Stripe checkout session
  fastify.post('/api/billing/checkout', async (request, reply) => {
    try {
      const user = await requireAuth(request);
      const body = request.body as { planId: string; priceId: string };

      if (!body.planId || !body.priceId) {
        return reply.code(400).send({
          error: { code: 'MISSING_FIELDS', message: 'planId and priceId are required' },
        });
      }

      const env = getEnv();
      const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

      const result = await createCheckoutSession(
        user.id,
        body.planId,
        body.priceId,
        `${frontendUrl}/dashboard/settings/billing?session_id={CHECKOUT_SESSION_ID}&status=success`,
        `${frontendUrl}/dashboard/settings/billing?status=canceled`,
      );

      return reply.send(result);
    } catch (error) {
      console.error('[Billing] Checkout error:', error);
      const errorResponse = formatErrorResponse(request, error);
      return reply.code(500).send(errorResponse);
    }
  });

  // POST /api/billing/portal — create Stripe customer portal session
  fastify.post('/api/billing/portal', async (request, reply) => {
    try {
      const user = await requireAuth(request);
      const env = getEnv();
      const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

      const url = await createPortalSession(
        user.id,
        `${frontendUrl}/dashboard/settings/billing`,
      );

      return reply.send({ url });
    } catch (error) {
      console.error('[Billing] Portal error:', error);
      const errorResponse = formatErrorResponse(request, error);
      return reply.code(500).send(errorResponse);
    }
  });
}

/**
 * Stripe webhook routes (separate from billing routes - different auth)
 */
export async function stripeWebhookRoutes(fastify: FastifyInstance) {
  // Stripe webhooks need raw body - add content type parser
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((_req: any, body: any, done: any) => { done(null, body); }) as any,
  );

  // POST /api/webhooks/stripe
  fastify.post('/api/webhooks/stripe', async (request, reply) => {
    const signature = request.headers['stripe-signature'] as string;
    if (!signature) {
      return reply.code(400).send({ error: 'Missing stripe-signature header' });
    }

    try {
      const rawBody = request.body as Buffer;
      const result = await handleWebhookEvent(rawBody, signature);

      if (result.handled) {
        console.log(`[Stripe] Handled webhook: ${result.eventType}`);
      } else {
        console.log(`[Stripe] Unhandled webhook type: ${result.eventType}`);
      }

      return reply.send({ received: true });
    } catch (error) {
      console.error('[Stripe] Webhook error:', error);
      return reply.code(400).send({
        error: error instanceof Error ? error.message : 'Webhook processing failed',
      });
    }
  });
}
