import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment schema validation (fail-fast)
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AKIS_HOST: z.string().default('0.0.0.0'),
  AKIS_PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  BACKEND_URL: z.string().url().default('http://localhost:3000'),
  DATABASE_URL: z.string().url(),
  POSTGRES_HOST: z.string().default('localhost'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_DB: z.string().default('akis_v2'),
  POSTGRES_USER: z.string().default('postgres'),
  POSTGRES_PASSWORD: z.string().default('postgres'),
  GITHUB_MCP_BASE_URL: z.string().url().optional(),
  ATLASSIAN_MCP_BASE_URL: z.string().url().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_INSTALLATION_ID: z.string().optional(),
  GITHUB_APP_PRIVATE_KEY_PEM: z.string().optional(),
  ATLASSIAN_ORG_ID: z.string().optional(),
  ATLASSIAN_API_TOKEN: z.string().optional(),
  ATLASSIAN_EMAIL: z.string().email().optional(),
  AI_PROVIDER: z.string().default('openrouter'),
  AI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Get validated environment variables
 * @throws Error if validation fails
 */
export function getEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .filter((e) => e.code === 'invalid_type' && e.received === 'undefined')
        .map((e) => e.path.join('.'));
      const invalid = error.errors
        .filter((e) => e.code !== 'invalid_type' || e.received !== 'undefined')
        .map((e) => `${e.path.join('.')}: ${e.message}`);

      const messages: string[] = [];
      if (missing.length > 0) {
        messages.push(`Missing required env vars: ${missing.join(', ')}`);
      }
      if (invalid.length > 0) {
        messages.push(`Invalid env vars: ${invalid.join('; ')}`);
      }

      throw new Error(`Environment validation failed:\n${messages.join('\n')}`);
    }
    throw error;
  }
}

