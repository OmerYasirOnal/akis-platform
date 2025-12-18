/**
 * Integrations API - S0.4.6
 * GET /api/integrations/connect/:provider
 */
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getEnv } from '../config/env.js';

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
}

