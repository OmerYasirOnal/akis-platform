import { FastifyInstance } from 'fastify';
import { Registry, Counter, Histogram } from 'prom-client';

/**
 * Phase 7.B: Prometheus metrics endpoint
 * Minimal overhead, OCI free-tier friendly
 */

// Create a registry for custom metrics
const register = new Registry();

// HTTP duration histogram
const httpDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

// Job counters
const jobsCreated = new Counter({
  name: 'jobs_created_total',
  help: 'Total number of jobs created',
  labelNames: ['type'],
  registers: [register],
});

const jobsCompleted = new Counter({
  name: 'jobs_completed_total',
  help: 'Total number of jobs completed',
  labelNames: ['type'],
  registers: [register],
});

const jobsFailed = new Counter({
  name: 'jobs_failed_total',
  help: 'Total number of jobs failed',
  labelNames: ['type'],
  registers: [register],
});

// Export metrics for use in other modules
export const metrics = {
  httpDuration,
  jobsCreated,
  jobsCompleted,
  jobsFailed,
};

export async function metricsRoutes(fastify: FastifyInstance) {
  // GET /metrics - Prometheus format
  fastify.get(
    '/metrics',
    {
      schema: {
        description: 'Prometheus metrics endpoint',
        tags: ['monitoring'],
        response: {
          200: {
            type: 'string',
            description: 'Prometheus metrics in text format',
          },
        },
        hide: true, // Hide from Swagger UI (it's a monitoring endpoint)
      },
    },
    async (_request, reply) => {
      reply.type('text/plain; version=0.0.4; charset=utf-8');
      return register.metrics();
    }
  );
}

