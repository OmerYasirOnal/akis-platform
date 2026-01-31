import { getEnv } from '../../config/env.js';
import type { AIKeyProvider } from './user-ai-keys.js';

export const DEFAULT_OPENAI_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1-mini',
];

export const DEFAULT_OPENROUTER_MODELS = [
  'anthropic/claude-sonnet-4',
  'anthropic/claude-3.5-haiku',
  'google/gemini-2.5-flash',
  'meta-llama/llama-4-maverick',
  'deepseek/deepseek-chat-v3-0324',
];

/** @deprecated Use getScribeModelAllowlistByProvider instead */
export const DEFAULT_SCRIBE_MODELS = DEFAULT_OPENAI_MODELS;

export function getScribeModelAllowlist(): string[] {
  const env = getEnv();
  if (env.AI_SCRIBE_MODEL_ALLOWLIST) {
    return env.AI_SCRIBE_MODEL_ALLOWLIST.split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return DEFAULT_SCRIBE_MODELS;
}

/**
 * Get allowed models for a specific provider.
 * Env override applies to all providers (comma-separated list).
 */
export function getScribeModelAllowlistByProvider(provider?: AIKeyProvider): string[] {
  const env = getEnv();
  if (env.AI_SCRIBE_MODEL_ALLOWLIST) {
    return env.AI_SCRIBE_MODEL_ALLOWLIST.split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  if (provider === 'openrouter') {
    return DEFAULT_OPENROUTER_MODELS;
  }
  return DEFAULT_OPENAI_MODELS;
}

export function isModelAllowed(model: string, allowlist: string[]): boolean {
  return allowlist.includes(model);
}
