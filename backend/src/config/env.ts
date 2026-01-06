import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

// =============================================================================
// ENV LOADING (Correct Precedence)
// =============================================================================
// Priority: 1) Shell exports  2) .env.local  3) .env
// .env.local overrides .env, but shell exports override both
// =============================================================================

// Get backend directory (where .env files are located)
const backendDir = resolve(import.meta.dirname, '../../');

// Load .env first (base defaults)
loadEnv({ path: resolve(backendDir, '.env') });

// Load .env.local second (local overrides) - this WILL override .env values
loadEnv({ path: resolve(backendDir, '.env.local'), override: true });

/**
 * Environment schema validation (fail-fast)
 * Atlassian vars are optional in development unless MCP_ATLASSIAN_ENABLED=true
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    AKIS_HOST: z.string().default('0.0.0.0'),
    AKIS_PORT: z.coerce.number().default(3000),
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
    POSTGRES_HOST: z.string().default('localhost'),
    POSTGRES_PORT: z.coerce.number().default(5433),
    POSTGRES_DB: z.string().default('akis_v2'),
    POSTGRES_USER: z.string().default('postgres'),
    POSTGRES_PASSWORD: z.string().default('postgres'),
    AUTH_COOKIE_NAME: z.string().default('akis_sid'),
    AUTH_COOKIE_MAXAGE: z.coerce.number().default(60 * 60 * 24 * 7), // 7 days in seconds
    AUTH_COOKIE_SAMESITE: z
      .enum(['Lax', 'Strict', 'None', 'lax', 'strict', 'none'])
      .default('Lax')
      .transform((value) => value.toLowerCase() as 'lax' | 'strict' | 'none'),
    AUTH_COOKIE_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    AUTH_COOKIE_DOMAIN: z.string().optional(),
    AUTH_JWT_SECRET: z.string().min(32, 'AUTH_JWT_SECRET must be at least 32 characters long').optional(),
    // Email configuration
    EMAIL_PROVIDER: z.enum(['mock', 'resend']).default('mock'),
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().optional(),
    EMAIL_VERIFICATION_TOKEN_TTL_MINUTES: z.coerce.number().default(15),
    // OAuth Configuration (S0.4.2)
    // OAuth credentials for user login (separate from GitHub App credentials)
    GITHUB_OAUTH_CLIENT_ID: z.string().optional(),
    GITHUB_OAUTH_CLIENT_SECRET: z.string().optional(),
    GOOGLE_OAUTH_CLIENT_ID: z.string().optional(),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional(),
    // GitHub App Configuration (MCP Integration)
    // These are for GitHub App installation, NOT for OAuth user login
    // Preprocess empty strings to undefined to handle test environments
    GITHUB_MCP_BASE_URL: z.preprocess(
      (val) => (val === '' || val === undefined ? undefined : val),
      z.string().url().optional()
    ),
    ATLASSIAN_MCP_BASE_URL: z.preprocess(
      (val) => (val === '' || val === undefined ? undefined : val),
      z.string().url().optional()
    ),
    GITHUB_APP_ID: z.string().optional(),
    GITHUB_INSTALLATION_ID: z.string().optional(),
    GITHUB_APP_PRIVATE_KEY_PEM: z.string().optional(),
    GITHUB_TOKEN: z.string().optional(), // Personal Access Token for MVP/Dev
    SCRIBE_DEV_GITHUB_BOOTSTRAP: z.enum(['true', 'false']).default('false'),
    SCRIBE_DEV_BOOTSTRAP_GITHUB_TOKEN: z.string().optional(),
    MCP_ATLASSIAN_ENABLED: z.string().default('false'),
    ATLASSIAN_ORG_ID: z.string().optional(),
    ATLASSIAN_API_TOKEN: z.string().optional(),
    ATLASSIAN_EMAIL: z.string().optional(),
    // AI Provider configuration
    AI_PROVIDER: z.enum(['openrouter', 'openai', 'mock']).default('mock'),
    AI_KEY_ENCRYPTION_KEY: z.string().optional(),
    AI_KEY_ENCRYPTION_KEY_VERSION: z.string().default('v1'),
    AI_SCRIBE_MODEL_ALLOWLIST: z.string().optional(),
    
    // API Keys - supports both new names and legacy OPENROUTER_*/OPENAI_* names
    AI_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    
    // Base URLs - supports legacy names
    AI_BASE_URL: z.string().url().optional(),
    OPENROUTER_BASE_URL: z.string().url().optional(),
    OPENAI_BASE_URL: z.string().url().optional(),
    
    // Model names - supports legacy OPENROUTER_MODEL/OPENAI_MODEL
    AI_MODEL_DEFAULT: z.string().optional(),
    AI_MODEL_PLANNER: z.string().optional(),
    AI_MODEL_VALIDATION: z.string().optional(),
    OPENROUTER_MODEL: z.string().optional(),
    OPENAI_MODEL: z.string().optional(),
    
    // OpenRouter optional headers
    OPENROUTER_SITE_URL: z.string().url().optional(),
    OPENROUTER_APP_NAME: z.string().optional(),
    
    // GitHub private key (base64 encoded)
    GITHUB_PRIVATE_KEY_BASE64: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isProduction = data.NODE_ENV === 'production';
    const isTestMode = data.NODE_ENV === 'test' || process.env.CI === 'true';
    const isAtlassianEnabled = data.MCP_ATLASSIAN_ENABLED === 'true';
    const isStrictMode = isProduction || isAtlassianEnabled;

    // AUTH_JWT_SECRET is required except in test/CI mode
    if (!isTestMode && !data.AUTH_JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AUTH_JWT_SECRET is required and must be at least 32 characters long',
        path: ['AUTH_JWT_SECRET'],
      });
    }

    if (data.AUTH_COOKIE_MAXAGE <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AUTH_COOKIE_MAXAGE must be greater than 0 seconds',
        path: ['AUTH_COOKIE_MAXAGE'],
      });
    }

    if (isProduction && !data.AUTH_COOKIE_SECURE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AUTH_COOKIE_SECURE must be true when NODE_ENV=production',
        path: ['AUTH_COOKIE_SECURE'],
      });
    }

    if (!isTestMode && !data.AI_KEY_ENCRYPTION_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'AI_KEY_ENCRYPTION_KEY is required for encrypting user AI keys',
        path: ['AI_KEY_ENCRYPTION_KEY'],
      });
    }

    // Email provider validation
    if (data.EMAIL_PROVIDER === 'resend') {
      if (!data.RESEND_API_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'RESEND_API_KEY is required when EMAIL_PROVIDER=resend',
          path: ['RESEND_API_KEY'],
        });
      }
      if (!data.RESEND_FROM_EMAIL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'RESEND_FROM_EMAIL is required when EMAIL_PROVIDER=resend',
          path: ['RESEND_FROM_EMAIL'],
        });
      }
    }

    // OAuth credentials validation
    // If a provider's client ID is provided, the secret must also be provided
    if (data.GITHUB_OAUTH_CLIENT_ID && !data.GITHUB_OAUTH_CLIENT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GITHUB_OAUTH_CLIENT_SECRET is required when GITHUB_OAUTH_CLIENT_ID is provided',
        path: ['GITHUB_OAUTH_CLIENT_SECRET'],
      });
    }
    if (!data.GITHUB_OAUTH_CLIENT_ID && data.GITHUB_OAUTH_CLIENT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GITHUB_OAUTH_CLIENT_ID is required when GITHUB_OAUTH_CLIENT_SECRET is provided',
        path: ['GITHUB_OAUTH_CLIENT_ID'],
      });
    }
    if (data.GOOGLE_OAUTH_CLIENT_ID && !data.GOOGLE_OAUTH_CLIENT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GOOGLE_OAUTH_CLIENT_SECRET is required when GOOGLE_OAUTH_CLIENT_ID is provided',
        path: ['GOOGLE_OAUTH_CLIENT_SECRET'],
      });
    }
    if (!data.GOOGLE_OAUTH_CLIENT_ID && data.GOOGLE_OAUTH_CLIENT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'GOOGLE_OAUTH_CLIENT_ID is required when GOOGLE_OAUTH_CLIENT_SECRET is provided',
        path: ['GOOGLE_OAUTH_CLIENT_ID'],
      });
    }

    if (isStrictMode) {
      // In production or when explicitly enabled, require all Atlassian vars
      if (!data.ATLASSIAN_ORG_ID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ATLASSIAN_ORG_ID is required when MCP_ATLASSIAN_ENABLED=true or NODE_ENV=production',
          path: ['ATLASSIAN_ORG_ID'],
        });
      }

      if (!data.ATLASSIAN_API_TOKEN) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ATLASSIAN_API_TOKEN is required when MCP_ATLASSIAN_ENABLED=true or NODE_ENV=production',
          path: ['ATLASSIAN_API_TOKEN'],
        });
      }

      if (!data.ATLASSIAN_EMAIL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'ATLASSIAN_EMAIL is required when MCP_ATLASSIAN_ENABLED=true or NODE_ENV=production',
          path: ['ATLASSIAN_EMAIL'],
        });
      } else {
        // Validate email format when required
        const emailSchema = z.string().email();
        const emailResult = emailSchema.safeParse(data.ATLASSIAN_EMAIL);
        if (!emailResult.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'ATLASSIAN_EMAIL must be a valid email address',
            path: ['ATLASSIAN_EMAIL'],
          });
        }
      }
    }
    // In development with MCP_ATLASSIAN_ENABLED=false, all Atlassian vars are optional (no validation)
  });

export type Env = z.infer<typeof envSchema>;

/**
 * Resolved AI configuration with fallbacks for legacy variable names
 */
export interface AIConfig {
  provider: 'openrouter' | 'openai' | 'mock';
  apiKey: string | undefined;
  baseUrl: string;
  modelDefault: string;
  modelPlanner: string;
  modelValidation: string;
  // OpenRouter optional headers
  siteUrl?: string;
  appName?: string;
}

/**
 * Get resolved AI configuration with legacy variable fallbacks.
 * Priority: AI_* variables take precedence over legacy OPENROUTER_* or OPENAI_* variables.
 */
export function getAIConfig(env: Env): AIConfig {
  const provider = env.AI_PROVIDER;
  
  // Resolve API key based on provider
  let apiKey: string | undefined;
  if (provider === 'openrouter') {
    apiKey = env.AI_API_KEY || env.OPENROUTER_API_KEY;
  } else if (provider === 'openai') {
    apiKey = env.AI_API_KEY || env.OPENAI_API_KEY;
  } else {
    apiKey = env.AI_API_KEY;
  }
  
  // Resolve base URL based on provider
  let baseUrl: string;
  if (provider === 'openrouter') {
    baseUrl = env.AI_BASE_URL || env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  } else if (provider === 'openai') {
    baseUrl = env.AI_BASE_URL || env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  } else {
    baseUrl = env.AI_BASE_URL || 'https://openrouter.ai/api/v1';
  }
  
  // Resolve models with legacy fallbacks
  // Default model for worker/generation tasks
  const legacyModel = provider === 'openrouter' 
    ? env.OPENROUTER_MODEL 
    : provider === 'openai' 
      ? env.OPENAI_MODEL 
      : undefined;
  
  const defaultModel = provider === 'openrouter'
    ? 'meta-llama/llama-3.3-70b-instruct:free'
    : provider === 'openai'
      ? 'gpt-4o-mini'
      : 'mock-model';
  
  const modelDefault = env.AI_MODEL_DEFAULT || legacyModel || defaultModel;
  const modelPlanner = env.AI_MODEL_PLANNER || legacyModel || defaultModel;
  const modelValidation = env.AI_MODEL_VALIDATION || legacyModel || defaultModel;
  
  // OpenRouter optional headers
  const siteUrl = env.OPENROUTER_SITE_URL;
  const appName = env.OPENROUTER_APP_NAME;
  
  return {
    provider,
    apiKey,
    baseUrl,
    modelDefault,
    modelPlanner,
    modelValidation,
    siteUrl,
    appName,
  };
}

let validatedEnv: Env | null = null;

/**
 * Get validated environment variables
 * @throws Error if validation fails
 */
export function getEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  // Prepare env with test fallbacks for CI/test mode
  const isTestMode = process.env.NODE_ENV === 'test' || process.env.CI === 'true';
  const envWithFallbacks = {
    ...process.env,
    // Provide test fallback for AUTH_JWT_SECRET in CI/test mode
    AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET || (isTestMode ? 'test-jwt-secret-at-least-32-chars-long' : undefined),
  };

  try {
    validatedEnv = envSchema.parse(envWithFallbacks);
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
