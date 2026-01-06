import { getEnv } from '../../config/env.js';

export const DEFAULT_SCRIBE_MODELS = [
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1-mini',
];

export function getScribeModelAllowlist(): string[] {
  const env = getEnv();
  if (env.AI_SCRIBE_MODEL_ALLOWLIST) {
    return env.AI_SCRIBE_MODEL_ALLOWLIST.split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return DEFAULT_SCRIBE_MODELS;
}

export function isModelAllowed(model: string, allowlist: string[]): boolean {
  return allowlist.includes(model);
}
