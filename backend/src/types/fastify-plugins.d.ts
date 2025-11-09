import type { FastifyInstance, FastifyPluginCallback } from 'fastify';

declare module '@fastify/cookie' {
  const plugin: FastifyPluginCallback<{ hook?: string }>;
  export default plugin;
}

declare module '@fastify/helmet' {
  const plugin: FastifyPluginCallback<Record<string, unknown>>;
  export default plugin;
}

declare module '@fastify/rate-limit' {
  const plugin: FastifyPluginCallback<Record<string, unknown>>;
  export default plugin;
}

declare module 'fastify-plugin' {
  function fastifyPlugin<Options = Record<string, unknown>>(
    fn: (instance: FastifyInstance, opts: Options) => unknown,
    opts?: Record<string, unknown>
  ): (instance: FastifyInstance, opts: Options) => unknown;
  export default fastifyPlugin;
}
