type FastifyHook = (
  request: FastifyRequest,
  reply: FastifyReply,
  ...args: unknown[]
) => unknown | Promise<unknown>;

declare module 'fastify' {
  export interface FastifyRequest {
    id: string;
    body?: unknown;
    params?: Record<string, unknown>;
    query?: Record<string, unknown>;
    headers: Record<string, unknown>;
    method: string;
    url: string;
    routerPath?: string;
    cookies?: Record<string, string>;
    authSessionId?: string;
  }

  export interface FastifyReply {
    requestId?: string;
    statusCode: number;
    elapsedTime: number;
    code(statusCode: number): FastifyReply;
    send(payload?: unknown): FastifyReply;
    type(contentType: string): FastifyReply;
    setCookie(name: string, value: string, options?: Record<string, unknown>): FastifyReply;
    clearCookie(name: string, options?: Record<string, unknown>): FastifyReply;
    setAuthCookie(sessionId: string): FastifyReply;
    clearAuthCookie(): FastifyReply;
  }

  export type FastifyHandler = (
    request: FastifyRequest,
    reply: FastifyReply
  ) => unknown | Promise<unknown>;

  export interface FastifyInstance {
    authCookieName?: string;
    get(path: string, handler: FastifyHandler): FastifyInstance;
    get(path: string, opts: Record<string, unknown>, handler: FastifyHandler): FastifyInstance;
    post(path: string, handler: FastifyHandler): FastifyInstance;
    post(path: string, opts: Record<string, unknown>, handler: FastifyHandler): FastifyInstance;
    register(
      plugin: (instance: FastifyInstance, opts: Record<string, unknown>) => unknown,
      opts?: Record<string, unknown>
    ): Promise<void>;
    addHook(name: string, hook: FastifyHook): FastifyInstance;
    decorate(name: string, value: unknown): FastifyInstance;
    decorateRequest(name: string, value: unknown): FastifyInstance;
    decorateReply(name: string, value: unknown): FastifyInstance;
    addContentTypeParser(
      contentType: string,
      opts: Record<string, unknown>,
      parser: (...args: unknown[]) => unknown
    ): void;
    addContentTypeParser(contentType: string, parser: (...args: unknown[]) => unknown): void;
    getDefaultJsonParser(
      onProtoPoisoning?: 'error' | 'remove' | 'ignore',
      onConstructorPoisoning?: 'error' | 'remove' | 'ignore'
    ): (...args: unknown[]) => unknown;
    setNotFoundHandler(handler: FastifyHandler): void;
    swagger(): unknown;
    listen(
      opts: { port: number; host?: string },
      callback: (err: Error | null) => void
    ): void;
    log: {
      info: (...args: unknown[]) => void;
      error: (...args: unknown[]) => void;
    };
  }

  export default function fastify(opts?: Record<string, unknown>): FastifyInstance;
}

