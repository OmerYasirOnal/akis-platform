import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const db = drizzle(pool);

const migrationsPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../migrations',
);

try {
  await migrate(db, { migrationsFolder: migrationsPath });
  console.info('Database migrations applied successfully.');
} catch (error) {
  console.error('Failed to apply database migrations:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

