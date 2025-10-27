/**
 * AI Model Constants
 * Can be safely imported in client-side components
 */

// Ücretsiz modeller (2025 güncel)
export const FREE_MODELS = {
  GEMINI_2_FLASH: 'google/gemini-2.0-flash-exp:free',
  LLAMA_3_3_70B: 'meta-llama/llama-3.3-70b-instruct:free',
  MISTRAL_7B: 'mistralai/mistral-7b-instruct:free',
} as const;

// Default model - En güçlü ve stabil ücretsiz model
export const DEFAULT_MODEL = FREE_MODELS.LLAMA_3_3_70B;

// Model açıklamaları
export const MODEL_DESCRIPTIONS = {
  [FREE_MODELS.GEMINI_2_FLASH]: 'Google Gemini 2.0 Flash - Hızlı ama rate limit riski var',
  [FREE_MODELS.LLAMA_3_3_70B]: 'Meta Llama 3.3 70B - Güçlü ve stabil (Önerilen) ⭐',
  [FREE_MODELS.MISTRAL_7B]: 'Mistral 7B - Hızlı ve verimli',
};

