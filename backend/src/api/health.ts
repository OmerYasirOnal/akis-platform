import { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { sql } from 'drizzle-orm';

// Read version from package.json at startup
const APP_VERSION = process.env.npm_package_version || '0.1.0';

export async function healthRoutes(fastify: FastifyInstance) {
  /**
   * GET /health - Basic liveness check
   * Returns 200 if the server is running
   */
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint (liveness)',
        tags: ['meta'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
            },
          },
        },
      },
    },
    async () => {
      return { status: 'ok' };
    }
  );

  /**
   * GET /ready - Readiness check
   * Returns 200 if the server is ready to accept requests (DB connected)
   */
  fastify.get(
    '/ready',
    {
      schema: {
        description: 'Readiness check endpoint (includes DB connectivity)',
        tags: ['meta'],
        response: {
          200: {
            type: 'object',
            properties: {
              ready: { type: 'boolean', example: true },
              database: { type: 'string', example: 'connected' },
            },
          },
          503: {
            type: 'object',
            properties: {
              ready: { type: 'boolean', example: false },
              database: { type: 'string', example: 'disconnected' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        // Test database connectivity with a simple query
        await db.execute(sql`SELECT 1`);
        return { ready: true, database: 'connected' };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reply.code(503).send({
          ready: false,
          database: 'disconnected',
          error: errorMessage,
        });
      }
    }
  );

  /**
   * GET /version - Application version info
   * Returns the semantic version from package.json
   */
  fastify.get(
    '/version',
    {
      schema: {
        description: 'Application version endpoint',
        tags: ['meta'],
        response: {
          200: {
            type: 'object',
            properties: {
              version: { type: 'string', example: '0.1.0' },
              name: { type: 'string', example: 'akis-backend' },
            },
          },
        },
      },
    },
    async () => {
      return {
        version: APP_VERSION,
        name: 'akis-backend',
      };
    }
  );
}

