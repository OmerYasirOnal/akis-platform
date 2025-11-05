import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  // Keep side effects minimal; runtime will set env in real usage
  // eslint-disable-next-line no-console
  console.warn('DATABASE_URL is not set. Drizzle client will initialize with a placeholder.');
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool);
export type DbClient = typeof db;


