declare module 'fastify' {
  interface FastifyInstance {
    authCookieName: string;
  }

  interface FastifyReply {
    requestId?: string;
    setAuthCookie(sessionId: string): FastifyReply;
    clearAuthCookie(): FastifyReply;
  }

  interface FastifyRequest {
    authSessionId?: string;
  }
}

