/**
 * Shared logger for use outside Fastify request context (e.g. orchestrator).
 * Same config as server: pino-pretty in dev, JSON in prod.
 * Orchestrator/agents push to log buffer explicitly for /api/admin/logs.
 */
import pino from 'pino';

const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development';

export const logger = isTest
  ? pino({ level: 'silent' })
  : pino({
      level: process.env.LOG_LEVEL || 'info',
      ...(isDev && {
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }),
    });
