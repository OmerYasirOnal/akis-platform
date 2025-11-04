import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import { registerApi } from './api/index.js';
import './agents/scribe/ScribeAgent.js'; // Ensure agent is registered

const app = Fastify({ logger: true });
await app.register(cors);
await app.register(helmet);
await app.register(sensible);
await registerApi(app);

const port = Number(process.env.PORT || 3000);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});


