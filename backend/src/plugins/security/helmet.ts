import helmet from '@fastify/helmet';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export interface HelmetPluginOptions {
  enableCSP: boolean;
}

export const helmetPlugin = fp<HelmetPluginOptions>(
  async (fastify: FastifyInstance, options: HelmetPluginOptions) => {
    await fastify.register(helmet, {
      contentSecurityPolicy: options.enableCSP,
      crossOriginResourcePolicy: { policy: 'same-origin' },
    });
  }
);

export type HelmetPlugin = typeof helmetPlugin;

