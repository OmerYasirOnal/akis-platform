import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import { createApp, type CreateAppOptions } from '../../src/server.app.js';
import { trackTestApp } from '../setup.js';

export interface BuildTestAppOptions extends CreateAppOptions {
  logger?: FastifyServerOptions['logger'];
}

export async function buildTestApp(
  options: BuildTestAppOptions = {}
): Promise<FastifyInstance> {
  const app = await createApp({
    enableDocs: false,
    logger: false,
    ...options,
  });

  trackTestApp(app);
  await app.ready();

  return app;
}


