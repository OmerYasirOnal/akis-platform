import { createApp } from './server.app.js';
import { getEnv } from './config/env.js';

const env = getEnv();

async function main() {
  const app = await createApp();
  const port = env.PORT ?? 3000;
  const host = env.HOST ?? '0.0.0.0';

  try {
    const address = await app.listen({ port, host });
    app.log.info(`Server listening on ${address}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void main();