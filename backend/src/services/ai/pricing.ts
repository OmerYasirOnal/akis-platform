export type ModelPricing = {
  inputUsdPer1M: number;
  outputUsdPer1M: number;
};

const PRICING_MAP: Record<string, ModelPricing> = {
  'gpt-4o-mini': { inputUsdPer1M: 0.15, outputUsdPer1M: 0.6 },
  'gpt-4o': { inputUsdPer1M: 5, outputUsdPer1M: 15 },
  'gpt-4.1-mini': { inputUsdPer1M: 0.3, outputUsdPer1M: 1.2 },
};

/**
 * Returns pricing info (input/output cost per 1M tokens) for an AI model.
 * @param model - The model identifier (e.g. 'gpt-4o-mini')
 * @returns Pricing rates or null if model not in pricing map
 */
export function getModelPricing(model: string): ModelPricing | null {
  return PRICING_MAP[model] || null;
}

/**
 * Estimates the USD cost for a given model and token counts.
 * @param model - The model identifier
 * @param inputTokens - Number of input tokens consumed
 * @param outputTokens - Number of output tokens generated
 * @returns Estimated cost in USD (6 decimal places) or null if model unknown
 */
export function estimateCostUsd(
  model: string,
  inputTokens?: number,
  outputTokens?: number
): number | null {
  const pricing = getModelPricing(model);
  if (!pricing) {
    return null;
  }
  const input = inputTokens ?? 0;
  const output = outputTokens ?? 0;
  const cost =
    (input / 1_000_000) * pricing.inputUsdPer1M +
    (output / 1_000_000) * pricing.outputUsdPer1M;
  return Number(cost.toFixed(6));
}
