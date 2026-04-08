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

export const RECOMMENDED_MODELS: Record<AIKeyProvider, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
  openrouter: 'anthropic/claude-sonnet-4',
};

/** @deprecated Use getScribeModelAllowlistByProvider instead */
export const DEFAULT_SCRIBE_MODELS = DEFAULT_OPENAI_MODELS;

/** Returns the Scribe model allowlist from env override or defaults. */
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

/** Returns the recommended default model for a given AI provider. */
export function getRecommendedModel(provider: AIKeyProvider): string {
  return RECOMMENDED_MODELS[provider];
}

/** Checks whether a model ID is in the given allowlist. */
export function isModelAllowed(model: string, allowlist: string[]): boolean {
  return allowlist.includes(model);
}

/**
 * Check if a model ID looks like it belongs to a specific provider.
 * OpenRouter models typically have "org/model" format or ":free"/":nitro" suffix.
 * OpenAI models start with "gpt-", "o1", "text-", "davinci", etc.
 */
export function detectProviderFromModel(model: string): AIKeyProvider | null {
  if (model.startsWith('gpt-') || model.startsWith('o1') || 
      model.startsWith('o3') || model.startsWith('text-') || 
      model.startsWith('davinci')) {
    return 'openai';
  }
  if (model.includes('/') || model.includes(':free') || model.includes(':nitro')) {
    return 'openrouter';
  }
  return null;
}

/**
 * Validate that a model is compatible with a provider.
 * Returns true if model can be used with the provider.
 */
export function isModelCompatibleWithProvider(model: string, provider: AIKeyProvider): boolean {
  const modelProvider = detectProviderFromModel(model);
  
  // Unknown model format - allow it (could be a new model)
  if (modelProvider === null) {
    return true;
  }
  
  // OpenRouter can proxy OpenAI models
  if (provider === 'openrouter') {
    return true;
  }
  
  // OpenAI can only use OpenAI models
  return modelProvider === provider;
}
