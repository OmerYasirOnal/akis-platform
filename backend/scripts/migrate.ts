type ModuleLoadError = Error & { code?: string };

try {
  await import('dotenv/config');
} catch (error) {
  if (!(error instanceof Error)) {
    throw error;
  }

  const { code } = error as ModuleLoadError;

  if (code !== 'ERR_MODULE_NOT_FOUND' && code !== 'MODULE_NOT_FOUND') {
    throw error;
  }
}
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client } from 'pg';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
});

await client.connect();

const db = drizzle(client);

const migrationsPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../migrations',
);

try {
  await migrate(db, { migrationsFolder: migrationsPath });
  console.info('Database migrations applied successfully.');
} catch (error) {
  console.error('Failed to apply database migrations:', error);
  process.exitCode = 1;
} finally {
  await client.end();
}

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

