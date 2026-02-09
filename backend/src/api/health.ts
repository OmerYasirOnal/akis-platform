import { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { sql } from 'drizzle-orm';
import { isEncryptionConfigured } from '../utils/crypto.js';
import { isEmailConfigured } from '../services/email/index.js';
import { getEnv } from '../config/env.js';

// Build info - set at Docker build time via ARG/ENV
const BUILD_INFO = {
  version: process.env.npm_package_version || process.env.APP_VERSION || '0.1.0',
  commit: process.env.BUILD_COMMIT || process.env.GIT_COMMIT || 'unknown',
  buildTime: process.env.BUILD_TIME || 'unknown',
  environment: process.env.NODE_ENV || 'development',
  name: 'akis-backend',
};

// Startup time for uptime calculation
const START_TIME = new Date().toISOString();

export async function healthRoutes(fastify: FastifyInstance) {
  /**
   * GET /health - Basic liveness check
   * Returns 200 if the server is running
   * Used by: Load balancers, uptime monitors, CI/CD health gates
   */
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint (liveness). No auth required.',
        tags: ['meta'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              timestamp: { type: 'string', example: '2026-01-09T12:00:00.000Z' },
            },
          },
        },
      },
    },
    async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    }
  );

  /**
   * GET /ready - Readiness check
   * Returns 200 if the server is ready to accept requests (DB connected)
   * Used by: Container orchestration, CI/CD deploy verification
   */
  fastify.get(
    '/ready',
    {
      schema: {
        description: 'Readiness check endpoint (includes DB connectivity). No auth required.',
        tags: ['meta'],
        response: {
          200: {
            type: 'object',
            properties: {
              ready: { type: 'boolean', example: true },
              database: { type: 'string', example: 'connected' },
              migrations: { type: 'string', example: 'ok' },
              encryption: {
                type: 'object',
                properties: {
                  configured: { type: 'boolean', example: true },
                },
              },
              email: {
                type: 'object',
                properties: {
                  configured: { type: 'boolean', example: true },
                  provider: { type: 'string', example: 'smtp' },
                },
              },
              oauth: {
                type: 'object',
                properties: {
                  google: { type: 'boolean', example: true },
                  github: { type: 'boolean', example: true },
                  callbackBase: { type: 'string', example: 'https://staging.akisflow.com/auth/oauth' },
                },
              },
              timestamp: { type: 'string', example: '2026-01-09T12:00:00.000Z' },
            },
          },
          503: {
            type: 'object',
            properties: {
              ready: { type: 'boolean', example: false },
              database: { type: 'string', example: 'disconnected' },
              migrations: { type: 'string', example: 'unknown' },
              encryption: {
                type: 'object',
                properties: {
                  configured: { type: 'boolean', example: false },
                },
              },
              email: {
                type: 'object',
                properties: {
                  configured: { type: 'boolean', example: false },
                  provider: { type: 'string', example: 'mock' },
                },
              },
              oauth: {
                type: 'object',
                properties: {
                  google: { type: 'boolean', example: false },
                  github: { type: 'boolean', example: false },
                  callbackBase: { type: 'string' },
                },
              },
              error: { type: 'string' },
              timestamp: { type: 'string', example: '2026-01-09T12:00:00.000Z' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const timestamp = new Date().toISOString();
      const encryptionStatus = { configured: isEncryptionConfigured() };
      const emailProvider = process.env.EMAIL_PROVIDER || 'mock';
      const emailStatus = { configured: isEmailConfigured(emailProvider), provider: emailProvider };

      // OAuth provider readiness (no secrets, just configured/not)
      let oauthStatus: Record<string, unknown> = {};
      try {
        const cfg = getEnv();
        oauthStatus = {
          google: !!(cfg.GOOGLE_OAUTH_CLIENT_ID && cfg.GOOGLE_OAUTH_CLIENT_SECRET),
          github: !!(cfg.GITHUB_OAUTH_CLIENT_ID && cfg.GITHUB_OAUTH_CLIENT_SECRET),
          callbackBase: cfg.BACKEND_URL ? `${cfg.BACKEND_URL}/auth/oauth` : 'NOT_SET',
        };
      } catch {
        oauthStatus = { google: false, github: false, callbackBase: 'env_error' };
      }

      try {
        // Test database connectivity and verify core schema exists
        const result = await db.execute(
          sql`SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users') AS has_users`
        );
        const rows = result.rows as Array<Record<string, unknown>>;
        const migrated = rows[0]?.has_users === true;
        return {
          ready: true,
          database: 'connected',
          migrations: migrated ? 'ok' : 'pending',
          encryption: encryptionStatus,
          email: emailStatus,
          oauth: oauthStatus,
          timestamp,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reply.code(503).send({
          ready: false,
          database: 'disconnected',
          migrations: 'unknown',
          encryption: encryptionStatus,
          email: emailStatus,
          oauth: oauthStatus,
          error: errorMessage,
          timestamp,
        });
      }
    }
  );

  /**
   * GET /version - Application version and build info
   * Returns semantic version, git commit, build time for CI/CD verification
   * Used by: Deploy pipelines to verify correct version is deployed
   */
  fastify.get(
    '/version',
    {
      schema: {
        description: 'Application version and build info endpoint. No auth required.',
        tags: ['meta'],
        response: {
          200: {
            type: 'object',
            properties: {
              version: { type: 'string', example: '0.1.0' },
              name: { type: 'string', example: 'akis-backend' },
              commit: { type: 'string', example: 'abc1234' },
              buildTime: { type: 'string', example: '2026-01-09T12:00:00.000Z' },
              environment: { type: 'string', example: 'production' },
              startTime: { type: 'string', example: '2026-01-09T12:00:00.000Z' },
            },
          },
        },
      },
    },
    async () => {
      return {
        ...BUILD_INFO,
        startTime: START_TIME,
      };
    }
  );
}

