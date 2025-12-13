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
        // Build cookie options, only including domain if explicitly set
        // For localhost development, omitting domain is correct behavior
        const cookieOptions: {
          httpOnly: boolean;
          path: string;
          maxAge: number;
          sameSite: 'lax' | 'strict' | 'none';
          secure: boolean;
          domain?: string;
        } = {
          httpOnly: true,
          path: '/',
          maxAge: options.maxAge,
          sameSite: options.sameSite,
          secure: options.secure,
        };
        
        if (options.domain && options.domain.length > 0) {
          cookieOptions.domain = options.domain;
        }
        
        this.setCookie(options.name, sessionId, cookieOptions);
        return this;
      }
    );

    fastify.decorateReply('clearAuthCookie', function clearAuthCookie(this: FastifyReply) {
      const clearOptions: {
        path: string;
        sameSite: 'lax' | 'strict' | 'none';
        domain?: string;
      } = {
        path: '/',
        sameSite: options.sameSite,
      };
      
      if (options.domain && options.domain.length > 0) {
        clearOptions.domain = options.domain;
      }
      
      this.clearCookie(options.name, clearOptions);
      return this;
    });
  }
);

export type CookiesPlugin = typeof cookiesPlugin;


