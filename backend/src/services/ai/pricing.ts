export type ModelPricing = {
  inputUsdPer1M: number;
  outputUsdPer1M: number;
};

const PRICING_MAP: Record<string, ModelPricing> = {
  'gpt-4o-mini': { inputUsdPer1M: 0.15, outputUsdPer1M: 0.6 },
  'gpt-4o': { inputUsdPer1M: 5, outputUsdPer1M: 15 },
  'gpt-4.1-mini': { inputUsdPer1M: 0.3, outputUsdPer1M: 1.2 },
};

export function getModelPricing(model: string): ModelPricing | null {
  return PRICING_MAP[model] || null;
}

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
