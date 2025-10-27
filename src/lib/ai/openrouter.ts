import "server-only";

/**
 * OpenRouter AI Provider Configuration
 * Ücretsiz modeller: google/gemini-flash-1.5, meta-llama/llama-3.1-8b-instruct:free
 * 
 * BUGFIX: Fallback to OPENAI_API_KEY if OPENROUTER_API_KEY is missing
 * Server-only module (build-time enforced) - API keys never exposed to client
 */

import { createOpenAI } from '@ai-sdk/openai';

// Get API key with fallback
// BUGFIX: Lazy evaluation to avoid client-side errors
// NOTE: server-only guard at top ensures this never runs on client
const getAPIKey = (): string => {

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (openrouterKey) {
    console.log('[OpenRouter] ✅ Using OPENROUTER_API_KEY');
    return openrouterKey;
  }

  if (openaiKey) {
    console.warn('[OpenRouter] ⚠️ OPENROUTER_API_KEY not found, falling back to OPENAI_API_KEY');
    console.warn('[OpenRouter] ⚠️ Note: Using OpenAI with OpenRouter models may cause issues');
    return openaiKey;
  }

  const errorMsg = 'OpenAI/OpenRouter API key is missing. Add OPENROUTER_API_KEY or OPENAI_API_KEY to .env.local';
  console.error(`[OpenRouter] ❌ ${errorMsg}`);
  throw new Error(errorMsg);
};

// OpenRouter custom provider
// BUGFIX: Lazy initialization - API key is fetched only when actually used (server-side)
export const openrouter = createOpenAI({
  apiKey: '', // Placeholder - will be replaced at runtime
  baseURL: 'https://openrouter.ai/api/v1',
});

// Helper to get configured openrouter with actual API key
// Use this in server-side code instead of direct openrouter
export function getOpenRouterClient() {
  const apiKey = getAPIKey();
  const baseURL = process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1';
  
  return createOpenAI({
    apiKey,
    baseURL,
  });
}

// NOTE: Model constants should be imported directly from @/lib/ai/models
// Do NOT re-export from this server-only file to avoid leaking server-only guard to client

