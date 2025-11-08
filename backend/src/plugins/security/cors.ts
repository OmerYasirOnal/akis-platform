import cors from '@fastify/cors';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

export interface CorsPluginOptions {
  origins: string[];
}

const LOCALHOST_VITE = 'http://localhost:5173';

export const corsPlugin = fp<CorsPluginOptions>(
  async (fastify: FastifyInstance, options: CorsPluginOptions) => {
    const normalizedOrigins = new Set<string>(
      options.origins
        .map((origin) => origin.trim())
        .filter(Boolean)
        .map((origin) => origin.replace(/\/$/, ''))
    );

    normalizedOrigins.add(LOCALHOST_VITE);

    const allowAll = normalizedOrigins.has('*');

    await fastify.register(cors, {
      credentials: true,
      exposedHeaders: ['set-cookie'],
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow: boolean) => void
      ) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const sanitizedOrigin = origin.replace(/\/$/, '');

        if (allowAll || normalizedOrigins.has(sanitizedOrigin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
    });
  }
);

export type CorsPlugin = typeof corsPlugin;


