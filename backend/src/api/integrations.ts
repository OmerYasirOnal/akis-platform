/**
 * Integrations API - S0.4.6
 * GET /api/integrations/connect/:provider
 * GET /api/integrations/github/owners
 * GET /api/integrations/github/repos
 * GET /api/integrations/github/branches
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getEnv } from '../config/env.js';
import { requireAuth } from '../utils/auth.js';
import { db } from '../db/client.js';
import { oauthAccounts } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER } from '../core/orchestrator/AgentOrchestrator.js';

// GitHub API helper
async function fetchFromGitHub<T>(endpoint: string, accessToken: string): Promise<T> {
  const response = await fetch(`https://api.github.com${endpoint}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'AKIS-Platform',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.message || `GitHub API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

// Helper to get user's GitHub OAuth token
async function getGitHubToken(userId: string): Promise<string | null> {
  const githubOAuth = await db.query.oauthAccounts.findFirst({
    where: and(
      eq(oauthAccounts.userId, userId),
      eq(oauthAccounts.provider, 'github')
    ),
  });

  const rawToken = githubOAuth?.accessToken || null;
  if (rawToken && rawToken !== DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER) {
    return rawToken;
  }

  if (rawToken === DEV_GITHUB_BOOTSTRAP_TOKEN_PLACEHOLDER && process.env.SCRIBE_DEV_GITHUB_BOOTSTRAP === 'true') {
    const env = getEnv();
    return env.SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN || env.GITHUB_TOKEN || null;
  }

  return rawToken;
}

export async function integrationsRoutes(fastify: FastifyInstance) {
  // GET /api/integrations/connect/:provider
  fastify.get(
    '/api/integrations/connect/:provider',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { provider } = request.params as { provider: string };
      const { returnTo } = request.query as { returnTo?: string };
      const config = getEnv();

      // Validate returnTo to prevent open redirect
      const allowedPaths = [
        '/dashboard',
        '/dashboard/agents/scribe',
        '/dashboard/agents/trace',
        '/dashboard/agents/proto',
      ];

      if (returnTo && !allowedPaths.some((path) => returnTo.startsWith(path))) {
        return reply.code(400).send({
          error: {
            code: 'INVALID_RETURN_PATH',
            message: `Invalid returnTo path. Allowed: ${allowedPaths.join(', ')}`,
          },
        });
      }

      // Check if provider OAuth is configured
      if (provider === 'github') {
        if (!config.GITHUB_OAUTH_CLIENT_ID || !config.GITHUB_OAUTH_CLIENT_SECRET) {
          return reply.code(501).send({
            error: {
              code: 'OAUTH_NOT_CONFIGURED',
              message: 'GitHub OAuth is not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET env vars.',
              provider: 'github',
              missingVars: [
                !config.GITHUB_OAUTH_CLIENT_ID ? 'GITHUB_OAUTH_CLIENT_ID' : null,
                !config.GITHUB_OAUTH_CLIENT_SECRET ? 'GITHUB_OAUTH_CLIENT_SECRET' : null,
              ].filter(Boolean),
            },
          });
        }

        // OAuth flow - redirect to GitHub
        const callbackUrl = `${config.BACKEND_URL}/auth/oauth/github/callback`;
        const state = Buffer.from(JSON.stringify({ returnTo: returnTo || '/dashboard' })).toString('base64');

        const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
        githubAuthUrl.searchParams.set('client_id', config.GITHUB_OAUTH_CLIENT_ID);
        githubAuthUrl.searchParams.set('redirect_uri', callbackUrl);
        githubAuthUrl.searchParams.set('scope', 'read:user user:email repo');
        githubAuthUrl.searchParams.set('state', state);

        return reply.code(302).header('Location', githubAuthUrl.toString()).send();
      }

      if (provider === 'confluence') {
        return reply.code(501).send({
          error: {
            code: 'OAUTH_NOT_CONFIGURED',
            message: 'Confluence OAuth is not yet implemented.',
            provider: 'confluence',
          },
        });
      }

      return reply.code(400).send({
        error: {
          code: 'UNKNOWN_PROVIDER',
          message: `Unknown provider: ${provider}`,
        },
      });
    }
  );

  // GET /api/integrations/github/owners
  fastify.get(
    '/api/integrations/github/owners',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const token = await getGitHubToken(user.id);

        if (!token) {
          return reply.code(412).send({
            error: {
              code: 'GITHUB_NOT_CONNECTED',
              message: 'GitHub is not connected. Please connect GitHub first.',
            },
          });
        }

        // Get authenticated user
        const githubUser = await fetchFromGitHub<{ login: string; avatar_url: string }>(
          '/user',
          token
        );

        // Get user's organizations
        const orgs = await fetchFromGitHub<Array<{ login: string; avatar_url: string }>>(
          '/user/orgs',
          token
        );

        const owners = [
          { login: githubUser.login, type: 'User' as const, avatarUrl: githubUser.avatar_url },
          ...orgs.map((org) => ({
            login: org.login,
            type: 'Organization' as const,
            avatarUrl: org.avatar_url,
          })),
        ];

        return reply.code(200).send({ owners });
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

  // GET /api/integrations/github/repos
  fastify.get(
    '/api/integrations/github/repos',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const { owner } = request.query as { owner?: string };

        if (!owner) {
          return reply.code(400).send({
            error: { code: 'MISSING_OWNER', message: 'owner query parameter is required' },
          });
        }

        const token = await getGitHubToken(user.id);

        if (!token) {
          return reply.code(412).send({
            error: {
              code: 'GITHUB_NOT_CONNECTED',
              message: 'GitHub is not connected. Please connect GitHub first.',
            },
          });
        }

        // Fetch repos for the owner
        // First check if owner is the authenticated user or an org
        const githubUser = await fetchFromGitHub<{ login: string }>('/user', token);

        let rawRepos: Array<{
          name: string;
          full_name: string;
          default_branch: string;
          private: boolean;
          description: string | null;
        }>;

        if (owner === githubUser.login) {
          // User's own repos
          rawRepos = await fetchFromGitHub('/user/repos?per_page=100&sort=updated', token);
        } else {
          // Organization repos
          rawRepos = await fetchFromGitHub(`/orgs/${encodeURIComponent(owner)}/repos?per_page=100&sort=updated`, token);
        }

        const repos = rawRepos.map((repo) => ({
          name: repo.name,
          fullName: repo.full_name,
          defaultBranch: repo.default_branch,
          private: repo.private,
          description: repo.description,
        }));

        return reply.code(200).send({ repos });
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

  // GET /api/integrations/github/branches
  fastify.get(
    '/api/integrations/github/branches',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const { owner, repo } = request.query as { owner?: string; repo?: string };

        if (!owner || !repo) {
          return reply.code(400).send({
            error: {
              code: 'MISSING_PARAMS',
              message: 'owner and repo query parameters are required',
            },
          });
        }

        const token = await getGitHubToken(user.id);

        if (!token) {
          return reply.code(412).send({
            error: {
              code: 'GITHUB_NOT_CONNECTED',
              message: 'GitHub is not connected. Please connect GitHub first.',
            },
          });
        }

        // Get repo info for default branch
        const repoInfo = await fetchFromGitHub<{ default_branch: string }>(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
          token
        );

        // Get branches
        const rawBranches = await fetchFromGitHub<Array<{ name: string }>>(
          `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?per_page=100`,
          token
        );

        const branches = rawBranches.map((branch) => ({
          name: branch.name,
          isDefault: branch.name === repoInfo.default_branch,
        }));

        return reply.code(200).send({
          branches,
          defaultBranch: repoInfo.default_branch,
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

