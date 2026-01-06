/**
 * Integrations API - OAuth-based GitHub integration
 * GET /api/integrations/github/oauth/start
 * GET /api/integrations/github/oauth/callback
 * GET /api/integrations/github/status
 * DELETE /api/integrations/github
 * GET /api/integrations/github/owners
 * GET /api/integrations/github/repos
 * GET /api/integrations/github/branches
 */
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { randomBytes } from 'crypto';
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
  // GET /api/integrations/github/oauth/start - Start OAuth flow
  fastify.get(
    '/api/integrations/github/oauth/start',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Require AKIS session
        await requireAuth(request);
        const config = getEnv();

        // Check OAuth configuration
        if (!config.GITHUB_OAUTH_CLIENT_ID || !config.GITHUB_OAUTH_CLIENT_SECRET) {
          return reply.code(501).send({
            error: {
              code: 'GITHUB_OAUTH_NOT_CONFIGURED',
              message: 'GitHub OAuth is not configured. Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET env vars.',
            },
          });
        }

        if (!config.GITHUB_OAUTH_CALLBACK_URL) {
          return reply.code(501).send({
            error: {
              code: 'GITHUB_OAUTH_NOT_CONFIGURED',
              message: 'GITHUB_OAUTH_CALLBACK_URL is not configured.',
            },
          });
        }

        // Generate CSRF state token
        const state = randomBytes(32).toString('hex');

        // Store state in httpOnly cookie (10 min TTL)
        reply.setCookie('github_oauth_state', state, {
          httpOnly: true,
          secure: config.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 10 * 60, // 10 minutes
          path: '/',
        });

        // Build GitHub authorize URL
        const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
        githubAuthUrl.searchParams.set('client_id', config.GITHUB_OAUTH_CLIENT_ID);
        githubAuthUrl.searchParams.set('redirect_uri', config.GITHUB_OAUTH_CALLBACK_URL);
        githubAuthUrl.searchParams.set('scope', 'read:user user:email repo');
        githubAuthUrl.searchParams.set('state', state);

        // Redirect to GitHub
        return reply.code(302).header('Location', githubAuthUrl.toString()).send();
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          // User not logged in - redirect to login with returnTo
          const config = getEnv();
          const returnTo = encodeURIComponent('/dashboard/integrations');
          return reply.code(302).header('Location', `${config.APP_PUBLIC_URL}/login?returnTo=${returnTo}`).send();
        }
        throw err;
      }
    }
  );

  // GET /api/integrations/github/oauth/callback - OAuth callback from GitHub
  fastify.get(
    '/api/integrations/github/oauth/callback',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code, state: receivedState } = request.query as { code?: string; state?: string };
      const config = getEnv();

      try {
        // Verify we have an AKIS session
        const user = await requireAuth(request);

        // Validate code parameter
        if (!code) {
          const errorUrl = `${config.APP_PUBLIC_URL}/dashboard/integrations?github=error&reason=missing_code`;
          return reply.code(302).header('Location', errorUrl).send();
        }

        // Validate state (CSRF protection)
        const storedState = request.cookies?.github_oauth_state;
        if (!storedState || storedState !== receivedState) {
          const errorUrl = `${config.APP_PUBLIC_URL}/dashboard/integrations?github=error&reason=state_mismatch`;
          return reply.code(302).header('Location', errorUrl).send();
        }

        // Clear state cookie
        reply.clearCookie('github_oauth_state', { path: '/' });

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: config.GITHUB_OAUTH_CLIENT_ID,
            client_secret: config.GITHUB_OAUTH_CLIENT_SECRET,
            code,
            redirect_uri: config.GITHUB_OAUTH_CALLBACK_URL,
          }),
        });

        if (!tokenResponse.ok) {
          const errorUrl = `${config.APP_PUBLIC_URL}/dashboard/integrations?github=error&reason=token_exchange_failed`;
          return reply.code(302).header('Location', errorUrl).send();
        }

        const tokenData = await tokenResponse.json() as { access_token?: string; error?: string };
        
        if (tokenData.error || !tokenData.access_token) {
          const errorUrl = `${config.APP_PUBLIC_URL}/dashboard/integrations?github=error&reason=token_missing`;
          return reply.code(302).header('Location', errorUrl).send();
        }

        const accessToken = tokenData.access_token;

        // Fetch GitHub user info
        const userResponse = await fetch('https://api.github.com/user', {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'AKIS-Platform',
          },
        });

        if (!userResponse.ok) {
          const errorUrl = `${config.APP_PUBLIC_URL}/dashboard/integrations?github=error&reason=user_fetch_failed`;
          return reply.code(302).header('Location', errorUrl).send();
        }

        const githubUser = await userResponse.json() as { id: number; login: string };

        // Store/update in database
        const existingOAuth = await db.query.oauthAccounts.findFirst({
          where: and(
            eq(oauthAccounts.userId, user.id),
            eq(oauthAccounts.provider, 'github')
          ),
        });

        // TODO: Encrypt token at rest (similar to AI key storage)
        // For now storing plaintext, but interface ready for encryption
        if (existingOAuth) {
          await db
            .update(oauthAccounts)
            .set({
              accessToken: accessToken,
              providerAccountId: githubUser.id.toString(),
              updatedAt: new Date(),
            })
            .where(eq(oauthAccounts.id, existingOAuth.id));
        } else {
          await db.insert(oauthAccounts).values({
            userId: user.id,
            provider: 'github',
            providerAccountId: githubUser.id.toString(),
            accessToken: accessToken,
          });
        }

        // Redirect back to integrations with success
        const successUrl = `${config.APP_PUBLIC_URL}/dashboard/integrations?github=connected`;
        return reply.code(302).header('Location', successUrl).send();
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED') {
          // Session lost during callback - redirect to login
          const returnTo = encodeURIComponent('/dashboard/integrations');
          return reply.code(302).header('Location', `${config.APP_PUBLIC_URL}/login?returnTo=${returnTo}`).send();
        }
        
        // Unexpected error
        const errorUrl = `${config.APP_PUBLIC_URL}/dashboard/integrations?github=error&reason=internal_error`;
        return reply.code(302).header('Location', errorUrl).send();
      }
    }
  );

  // GET /api/integrations/github/status - Check GitHub connection status
  fastify.get(
    '/api/integrations/github/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);
        const token = await getGitHubToken(user.id);

        if (!token) {
          return reply.code(200).send({
            connected: false,
          });
        }

        try {
          // Verify token works by fetching user info
          const githubUser = await fetchFromGitHub<{ login: string; avatar_url: string; created_at: string }>(
            '/user',
            token
          );

          return reply.code(200).send({
            connected: true,
            login: githubUser.login,
            avatarUrl: githubUser.avatar_url,
          });
        } catch (_err) {
          // Token exists but is invalid/expired
          return reply.code(200).send({
            connected: false,
            error: 'Token invalid or expired',
          });
        }
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

  // DELETE /api/integrations/github - Disconnect GitHub
  // Note: TypeScript definitions for Fastify may not include 'delete' method in some versions
  // Using type assertion as runtime supports it
  (fastify as FastifyInstance & { delete: typeof fastify.get }).delete(
    '/api/integrations/github',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = await requireAuth(request);

        // Delete OAuth account for GitHub
        await db
          .delete(oauthAccounts)
          .where(
            and(
              eq(oauthAccounts.userId, user.id),
              eq(oauthAccounts.provider, 'github')
            )
          );

        return reply.code(200).send({
          ok: true,
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

