import { FastifyInstance } from 'fastify';
export default async function health(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true, ts: Date.now() }));
}


