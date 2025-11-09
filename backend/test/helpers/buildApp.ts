import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import { createApp, type CreateAppOptions } from '../../src/server.app.js';
import { trackTestApp } from '../setup.js';

export interface BuildTestAppOptions extends CreateAppOptions {
  logger?: FastifyServerOptions['logger'];
}

export async function buildTestApp(
  options: BuildTestAppOptions = {}
): Promise<FastifyInstance> {
  const loggerOption =
    process.env.TEST_ENABLE_LOGGER === '1'
      ? { level: 'debug' }
      : options.logger;

  if (process.env.TEST_ENABLE_LOGGER === '1') {
    console.log('buildTestApp: creating Fastify instance');
  }

  const app = await createApp({
    enableDocs: false,
    logger: loggerOption ?? false,
    ...options,
  });

  trackTestApp(app);
  if (process.env.TEST_ENABLE_LOGGER === '1') {
    console.log('buildTestApp: waiting for app.ready()');
  }
  await app.ready();
  if (process.env.TEST_ENABLE_LOGGER === '1') {
    console.log('buildTestApp: app ready');
  }

  return app;
}


