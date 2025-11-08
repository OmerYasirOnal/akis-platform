declare module '@fastify/cookie' {
  const plugin: unknown;
  export default plugin;
}

declare module '@fastify/helmet' {
  const plugin: unknown;
  export default plugin;
}

declare module '@fastify/rate-limit' {
  const plugin: unknown;
  export default plugin;
}

declare module 'fastify-plugin' {
  import type { FastifyInstance } from 'fastify';
  function fastifyPlugin<Options = Record<string, unknown>>(
    fn: (instance: FastifyInstance, opts: Options) => unknown,
    opts?: Record<string, unknown>
  ): (instance: FastifyInstance, opts: Options) => unknown;
  export default fastifyPlugin;
}
