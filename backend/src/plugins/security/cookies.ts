import cookie from '@fastify/cookie';
import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export interface CookiesPluginOptions {
  name: string;
  maxAge: number;
  sameSite: 'lax' | 'strict' | 'none';
  secure: boolean;
  domain?: string;
}

export const cookiesPlugin = fp<CookiesPluginOptions>(
  async (fastify: FastifyInstance, options: CookiesPluginOptions) => {
    await fastify.register(cookie, {
      hook: 'onRequest',
    });

    fastify.decorate('authCookieName', options.name);
    fastify.decorateRequest('authSessionId', null as string | null);

    fastify.addHook('onRequest', (request: FastifyRequest, _reply, done: (err?: Error) => void) => {
      const sessionId = request.cookies?.[options.name];
      if (sessionId) {
        request.authSessionId = sessionId;
      }
      done();
    });

    fastify.decorateReply(
      'setAuthCookie',
      function setAuthCookie(this: FastifyReply, sessionId: string) {
        this.setCookie(options.name, sessionId, {
          httpOnly: true,
          path: '/',
          maxAge: options.maxAge,
          sameSite: options.sameSite,
          secure: options.secure,
          domain: options.domain,
        });
        return this;
      }
    );

    fastify.decorateReply('clearAuthCookie', function clearAuthCookie(this: FastifyReply) {
      this.clearCookie(options.name, {
        path: '/',
        sameSite: options.sameSite,
        domain: options.domain,
      });
      return this;
    });
  }
);

export type CookiesPlugin = typeof cookiesPlugin;


