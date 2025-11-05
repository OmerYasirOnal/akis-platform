import Fastify from 'fastify';
import { agentsRoutes } from './api/agents';
import { healthRoutes } from './api/health';

export async function buildServer() {
  const app = Fastify({ logger: true });

  await app.register(healthRoutes);
  await app.register(agentsRoutes);

  return app;
}

if (require.main === module) {
  const host = process.env.AKIS_HOST || '0.0.0.0';
  const port = Number(process.env.AKIS_PORT || 3000);

  buildServer()
    .then((app) => app.listen({ host, port }))
    // eslint-disable-next-line no-console
    .then(() => console.log(`AKIS backend listening on http://${host}:${port}`))
    // eslint-disable-next-line no-console
    .catch((err) => console.error(err));
}


