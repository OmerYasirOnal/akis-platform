import 'dotenv/config';
import { z } from 'zod';

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
    POSTGRES_PORT: z.coerce.number().default(5432),
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
    AUTH_JWT_SECRET: z.string().min(32, 'AUTH_JWT_SECRET must be at least 32 characters long'),
    GITHUB_MCP_BASE_URL: z.string().url().optional(),
    ATLASSIAN_MCP_BASE_URL: z.string().url().optional(),
    GITHUB_APP_ID: z.string().optional(),
    GITHUB_INSTALLATION_ID: z.string().optional(),
    GITHUB_APP_PRIVATE_KEY_PEM: z.string().optional(),
    GITHUB_TOKEN: z.string().optional(), // Personal Access Token for MVP/Dev
    MCP_ATLASSIAN_ENABLED: z.string().default('false'),
    ATLASSIAN_ORG_ID: z.string().optional(),
    ATLASSIAN_API_TOKEN: z.string().optional(),
    ATLASSIAN_EMAIL: z.string().optional(),
    // AI Provider configuration
    AI_PROVIDER: z.enum(['openrouter', 'openai', 'mock']).default('mock'),
    
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
    
    // GitHub private key (base64 encoded)
    GITHUB_PRIVATE_KEY_BASE64: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isProduction = data.NODE_ENV === 'production';
    const isAtlassianEnabled = data.MCP_ATLASSIAN_ENABLED === 'true';
    const isStrictMode = isProduction || isAtlassianEnabled;

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
  
  return {
    provider,
    apiKey,
    baseUrl,
    modelDefault,
    modelPlanner,
    modelValidation,
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
