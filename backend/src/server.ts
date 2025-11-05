import { buildApp } from './server.app.js';
import { getEnv } from './config/env.js';

const env = getEnv();
const app = await buildApp();

const port = env.AKIS_PORT;
const host = env.AKIS_HOST;

app.listen({ port, host }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Server listening on http://${host}:${port}`);
});
