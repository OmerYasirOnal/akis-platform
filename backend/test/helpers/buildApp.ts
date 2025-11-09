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

  const app = await createApp({
    enableDocs: false,
    logger: loggerOption ?? false,
    ...options,
  });

  trackTestApp(app);
  await app.ready();

  return app;
}


