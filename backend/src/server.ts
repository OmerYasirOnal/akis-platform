import rateLimit from '@fastify/rate-limit';
import { buildApp } from './server.app.js';
import { getEnv } from './config/env.js';
import { corsPlugin } from './plugins/security/cors.js';
import { cookiesPlugin } from './plugins/security/cookies.js';
import { helmetPlugin } from './plugins/security/helmet.js';

const env = getEnv();
const app = await buildApp();

// Safe JSON parser
const jsonParser = app.getDefaultJsonParser('error', 'ignore');
app.addContentTypeParser('application/json', { parseAs: 'string' }, jsonParser);

// Security headers
await app.register(helmetPlugin, {
  enableCSP: env.NODE_ENV === 'production',
});

// Soft rate limit
await app.register(rateLimit, {
  max: 120,
  timeWindow: '1 minute',
  hook: 'onSend',
});

// CORS
await app.register(corsPlugin, {
  origins: env.CORS_ORIGINS,
});

// HttpOnly cookie (JWT)
await app.register(cookiesPlugin, {
  name: env.AUTH_COOKIE_NAME,
  maxAge: env.AUTH_COOKIE_MAXAGE,
  sameSite: env.AUTH_COOKIE_SAMESITE, // dev: Lax
  secure: env.AUTH_COOKIE_SECURE,      // dev: false
  domain: env.AUTH_COOKIE_DOMAIN,      // dev: localhost
});

const port = env.AKIS_PORT;
const host = env.AKIS_HOST;

app.listen({ port, host }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening on http://${host}:${port}`);
});