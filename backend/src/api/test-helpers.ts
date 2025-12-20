import { FastifyInstance } from 'fastify';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { requireAuth } from '../utils/auth.js';
import { getEnv } from '../config/env.js';
import { DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER } from '../core/orchestrator/AgentOrchestrator.js';

const bootstrapBodySchema = z
  .object({
    providerAccountId: z.string().max(255).optional(),
  })
  .optional();

export async function testHelpersRoutes(fastify: FastifyInstance) {
  const env = getEnv();
  const devBootstrapEnabled = env.NODE_ENV !== 'production' && process.env.SCRIBE_DEV_GITHUB_BOOTSTRAP === 'true';

  if (!devBootstrapEnabled) {
    return;
  }

  fastify.post(
    '/github/bootstrap',
    {
      schema: {
        hide: true,
        tags: ['test'],
        description: 'Dev/Test helper to mark current user as GitHub-connected without OAuth',
        response: {
          200: {
            type: 'object',
            properties: {
              ok: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = bootstrapBodySchema.parse(request.body);
        const user = await requireAuth(request);

        const providerAccountId = body?.providerAccountId ?? `dev-github-${user.id}`;
        const existing = await db.query.oauthAccounts.findFirst({
          where: and(eq(oauthAccounts.userId, user.id), eq(oauthAccounts.provider, 'github')),
        });

        if (existing) {
          await db
            .update(oauthAccounts)
            .set({
              providerAccountId,
              accessToken: DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER,
              updatedAt: new Date(),
            })
            .where(eq(oauthAccounts.id, existing.id));
        } else {
          await db.insert(oauthAccounts).values({
            userId: user.id,
            provider: 'github',
            providerAccountId,
            accessToken: DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER,
          });
        }

        reply.send({ ok: true });
      } catch (error) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
          reply.code(401).send({ error: 'UNAUTHORIZED' });
          return;
        }
        fastify.log.error({ err: error }, 'Failed to bootstrap GitHub connection');
        reply.code(500).send({ error: 'FAILED_TO_BOOTSTRAP' });
      }
    }
  );
}

