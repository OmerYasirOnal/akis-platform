import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { and, eq } from 'drizzle-orm';

const reposQuerySchema = z.object({
  installationId: z.string().optional(),
});

const branchParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
});

const branchQuerySchema = z.object({
  installationId: z.string().optional(),
});

async function ensureAuthenticated(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<{ userId: string } | null> {
  if (!request.user) {
    reply.code(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Bu işlem için giriş yapmalısınız.',
      },
    });
    return null;
  }
  return { userId: request.user.id };
}

async function resolveInstallationId(
  userId: string,
  requestedInstallationId?: string
): Promise<string | null> {
  const accounts = await db
    .select({
      installationId: oauthAccounts.installationId,
    })
    .from(oauthAccounts)
    .where(and(eq(oauthAccounts.userId, userId), eq(oauthAccounts.provider, 'github')));

  if (accounts.length === 0) {
    return null;
  }

  if (requestedInstallationId) {
    const match = accounts.find((account) => account.installationId === requestedInstallationId);
    return match?.installationId ?? null;
  }

  return accounts[0]?.installationId ?? null;
}

export async function githubRoutes(fastify: FastifyInstance) {
  fastify.get('/github/repos', async (request, reply) => {
    const auth = await ensureAuthenticated(request, reply);
    if (!auth) {
      return;
    }

    if (!fastify.featureFlags.githubAppEnabled) {
      reply.code(503).send({
        error: {
          code: 'GITHUB_APP_NOT_CONFIGURED',
          message: 'GitHub App kimlik bilgileri tanımlanmamış.',
        },
      });
      return;
    }

    const parseResult = reposQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Geçersiz sorgu parametreleri.',
          details: parseResult.error.flatten(),
        },
      });
      return;
    }

    const installationId = await resolveInstallationId(auth.userId, parseResult.data.installationId);
    if (!installationId) {
      reply.code(404).send({
        error: {
          code: 'INSTALLATION_NOT_FOUND',
          message: 'GitHub kurulumu bulunamadı. Lütfen GitHub hesabınızı yeniden bağlayın.',
        },
      });
      return;
    }

    try {
      const githubMcp = await fastify.githubAdapterFactory(installationId);
      const repositories = await githubMcp.listRepositories();
      reply.send({
        installationId,
        repositories,
      });
    } catch (error) {
      reply.code(502).send({
        error: {
          code: 'GITHUB_REPOS_FAILED',
          message: `GitHub depoları alınamadı: ${String(error)}`,
        },
      });
    }
  });

  fastify.get('/github/repos/:owner/:repo/branches', async (request, reply) => {
    const auth = await ensureAuthenticated(request, reply);
    if (!auth) {
      return;
    }

    if (!ensureGitHubAppConfigured(reply)) {
      return;
    }

    const paramsResult = branchParamsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Geçersiz repo parametreleri.',
        },
      });
      return;
    }

    const queryResult = branchQuerySchema.safeParse(request.query);
    if (!queryResult.success) {
      reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Geçersiz sorgu parametreleri.',
        },
      });
      return;
    }

    const installationId = await resolveInstallationId(auth.userId, queryResult.data.installationId);
    if (!installationId) {
      reply.code(404).send({
        error: {
          code: 'INSTALLATION_NOT_FOUND',
          message: 'GitHub kurulumu bulunamadı.',
        },
      });
      return;
    }

    try {
      const githubMcp = await fastify.githubAdapterFactory(installationId);
      const branches = await githubMcp.listBranches(paramsResult.data.owner, paramsResult.data.repo);
      reply.send({
        installationId,
        branches,
      });
    } catch (error) {
      reply.code(502).send({
        error: {
          code: 'GITHUB_BRANCHES_FAILED',
          message: `Git branch bilgisine erişilemedi: ${String(error)}`,
        },
      });
    }
  });
}


