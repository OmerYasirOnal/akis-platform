/**
 * Agent Config API - S0.4.6
 * GET/POST /api/agents/configs/:agentType
 * POST /api/agents/configs/:agentType/validate
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { agentConfigs, oauthAccounts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../utils/auth.js';

// Validation schemas
const agentTypeSchema = z.enum(['scribe', 'trace', 'proto']);

const scribeConfigSchema = z.object({
  enabled: z.boolean().optional(),
  repositoryOwner: z.string().min(1).optional(),
  repositoryName: z.string().min(1).optional(),
  baseBranch: z.string().optional(),
  branchPattern: z.string().optional(),
  targetPlatform: z.enum(['confluence', 'notion', 'github_wiki', 'github_repo']).optional(),
  targetConfig: z.record(z.unknown()).optional(),
  triggerMode: z.enum(['on_pr_merge', 'scheduled', 'manual']).optional(),
  scheduleCron: z.string().optional().nullable(),
  prTitleTemplate: z.string().optional(),
  prBodyTemplate: z.string().optional().nullable(),
  autoMerge: z.boolean().optional(),
  includeGlobs: z.array(z.string()).optional().nullable(),
  excludeGlobs: z.array(z.string()).optional().nullable(),
  jobTimeoutSeconds: z.number().int().min(10).max(600).optional(),
  maxRetries: z.number().int().min(0).max(5).optional(),
  llmModelOverride: z.string().optional().nullable(),
});

export async function agentConfigRoutes(fastify: FastifyInstance) {
  // GET /api/agents/configs/:agentType
  fastify.get(
    '/api/agents/configs/:agentType',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { agentType } = request.params as { agentType: string };
      try {
        const user = await requireAuth(request);

        // Load config
        const config = await db.query.agentConfigs.findFirst({
          where: and(
            eq(agentConfigs.userId, user.id),
            eq(agentConfigs.agentType, agentType)
          ),
        });

        // Load integration status
        const githubOAuth = await db.query.oauthAccounts.findFirst({
          where: and(
            eq(oauthAccounts.userId, user.id),
            eq(oauthAccounts.provider, 'github')
          ),
        });

        // Note: Confluence OAuth not yet implemented in schema
        const confluenceOAuth = null;

        const integrationStatus = {
          github: {
            connected: !!githubOAuth,
            username: githubOAuth?.providerAccountId || null,
            avatarUrl: null,
          },
          confluence: {
            connected: !!confluenceOAuth,
            siteName: null,
          },
        };

        return reply.code(200).send({
          config: config || null,
          integrationStatus,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }
        throw err;
      }
    }
  );

  // POST /api/agents/configs/:agentType (upsert)
  fastify.post(
    '/api/agents/configs/:agentType',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { agentType } = request.params as { agentType: string };
      const payload = request.body as z.infer<typeof scribeConfigSchema>;
      
      try {
        const user = await requireAuth(request);

        // Find existing config
        const existing = await db.query.agentConfigs.findFirst({
          where: and(
            eq(agentConfigs.userId, user.id),
            eq(agentConfigs.agentType, agentType)
          ),
        });

        let config;
        if (existing) {
          // Update
          const [updated] = await db
            .update(agentConfigs)
            .set({
              ...payload,
              updatedAt: new Date(),
            })
            .where(eq(agentConfigs.id, existing.id))
            .returning();
          config = updated;
        } else {
          // Insert
          const [created] = await db
            .insert(agentConfigs)
            .values({
              userId: user.id,
              agentType,
              ...payload,
            })
            .returning();
          config = created;
        }

        return reply.code(200).send({
          config,
          message: 'Configuration saved successfully',
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }
        throw err;
      }
    }
  );

  // POST /api/agents/configs/:agentType/validate
  fastify.post(
    '/api/agents/configs/:agentType/validate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request);

        // Stub: validation logic would go here
        // For now, just return success
        return reply.code(200).send({
          valid: true,
          errors: [],
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          return reply.code(401).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          });
        }
        throw err;
      }
    }
  );
}

