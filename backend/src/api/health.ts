import { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { sql } from 'drizzle-orm';

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
              timestamp: { type: 'string', example: '2026-01-09T12:00:00.000Z' },
            },
          },
          503: {
            type: 'object',
            properties: {
              ready: { type: 'boolean', example: false },
              database: { type: 'string', example: 'disconnected' },
              error: { type: 'string' },
              timestamp: { type: 'string', example: '2026-01-09T12:00:00.000Z' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const timestamp = new Date().toISOString();
      try {
        // Test database connectivity with a simple query
        await db.execute(sql`SELECT 1`);
        return { ready: true, database: 'connected', timestamp };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reply.code(503).send({
          ready: false,
          database: 'disconnected',
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

