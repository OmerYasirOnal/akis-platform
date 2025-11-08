import rateLimit from '@fastify/rate-limit';
import { buildApp } from './server.app.js';
import { getEnv } from './config/env.js';
import { corsPlugin } from './plugins/security/cors.js';
import { cookiesPlugin } from './plugins/security/cookies.js';
import { helmetPlugin } from './plugins/security/helmet.js';

const env = getEnv();
const app = await buildApp();

const jsonParser = app.getDefaultJsonParser('error', 'ignore');
app.addContentTypeParser('application/json', { parseAs: 'string' }, jsonParser);

await app.register(helmetPlugin, {
  enableCSP: env.NODE_ENV === 'production',
});

await app.register(rateLimit, {
  max: 120, // soft rate limit ~2 RPS
  timeWindow: '1 minute',
  hook: 'onSend',
});

await app.register(corsPlugin, {
  origins: env.CORS_ORIGINS,
});

await app.register(cookiesPlugin, {
  name: env.AUTH_COOKIE_NAME,
  maxAge: env.AUTH_COOKIE_MAXAGE,
  sameSite: env.AUTH_COOKIE_SAMESITE,
  secure: env.AUTH_COOKIE_SECURE,
  domain: env.AUTH_COOKIE_DOMAIN,
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
