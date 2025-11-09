import 'dotenv/config';
import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'] as const)
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().default(3000),
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),
    BACKEND_URL: z.string().url().default('http://localhost:3000'),
    CORS_ORIGINS: z
      .string()
      .default('http://localhost:5173')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean)
      ),
    DATABASE_URL: z.string().url(),
    AUTH_COOKIE_NAME: z.string().default('akis_session'),
    AUTH_COOKIE_SAMESITE: z
      .enum(['Lax', 'Strict', 'None', 'lax', 'strict', 'none'])
      .default('Lax')
      .transform((value) => value.toLowerCase() as 'lax' | 'strict' | 'none'),
    AUTH_COOKIE_SECURE: booleanString,
    AUTH_COOKIE_DOMAIN: z.string().optional(),
    AUTH_JWT_SECRET: z.string(),
    AUTH_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 24 * 30),
    GITHUB_MCP_BASE_URL: z.string().url().optional(),
    GITHUB_APP_ID: z.string().optional(),
    GITHUB_APP_PRIVATE_KEY: z.string().optional(),
    GITHUB_APP_WEBHOOK_SECRET: z.string().optional(),
    GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
    GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),
    GITHUB_OAUTH_CALLBACK_URL: z.string().url().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
    OPENROUTER_APP_REFERER: z.string().url().optional(),
    OPENROUTER_APP_TITLE: z.string().optional(),
    AKIS_MODEL_DEFAULT_SCRIBE: z.string().default('deepseek/deepseek-r1:free'),
    AKIS_MODEL_DEFAULT_TRACE: z.string().default('qwen/qwen3-coder:free'),
    AKIS_MODEL_DEFAULT_PROTO: z.string().default('qwen/qwen3-coder:free'),
    AI_PRIVACY_EXPERIMENTAL_ALLOWED: booleanString,
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production' && !data.AUTH_COOKIE_SECURE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AUTH_COOKIE_SECURE must be true when NODE_ENV=production',
        path: ['AUTH_COOKIE_SECURE'],
      });
    }

    if (!data.AUTH_JWT_SECRET || data.AUTH_JWT_SECRET.length < 32) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AUTH_JWT_SECRET must be at least 32 characters for HMAC security',
        path: ['AUTH_JWT_SECRET'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

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

