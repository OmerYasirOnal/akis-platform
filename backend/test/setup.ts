import { afterEach } from 'node:test';
import type { FastifyInstance } from 'fastify';

const activeApps = new Set<FastifyInstance>();

export function trackTestApp(app: FastifyInstance): void {
  if (activeApps.has(app)) {
    return;
  }

  activeApps.add(app);

  app.addHook('onClose', () => {
    activeApps.delete(app);
  });
}

afterEach(async () => {
  if (activeApps.size === 0) {
    return;
  }

  const apps = Array.from(activeApps);
  activeApps.clear();

  await Promise.all(
    apps.map(async (app) => {
      try {
        await app.close();
      } catch (error) {
        if (
          !(error instanceof Error) ||
          (error as { code?: string }).code === 'FST_ERR_INSTANCE_ALREADY_CLOSED' ||
          error.message === 'Fastify instance is already closed'
        ) {
          return;
        }
        throw error;
      }
    })
  );
});

process.on('unhandledRejection', (reason) => {
  throw reason instanceof Error ? reason : new Error(String(reason));
});


