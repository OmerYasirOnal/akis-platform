import { FastifyInstance } from 'fastify';
import health from './health.js';
export async function registerApi(app: FastifyInstance) {
  await app.register(health, { prefix: '/api' });
}
export default registerApi;


