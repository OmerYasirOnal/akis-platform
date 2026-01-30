export interface ModelDefinition {
  id: string;
  label: string;
  provider: 'openai' | 'openrouter';
  tier: 'budget' | 'standard' | 'premium';
  inputPricePer1M: number;
  outputPricePer1M: number;
}

export const MODEL_CATALOG: ModelDefinition[] = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai', tier: 'budget', inputPricePer1M: 0.15, outputPricePer1M: 0.60 },
  { id: 'gpt-5-mini', label: 'GPT-5 Mini', provider: 'openai', tier: 'standard', inputPricePer1M: 0.25, outputPricePer1M: 2.00 },
  { id: 'gpt-5.2', label: 'GPT-5.2', provider: 'openai', tier: 'premium', inputPricePer1M: 1.75, outputPricePer1M: 14.00 },
];

export const DEFAULT_MODEL_ID = 'gpt-5-mini';

export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_CATALOG.find(m => m.id === id);
}

export function getModelsByTier(tier: ModelDefinition['tier']): ModelDefinition[] {
  return MODEL_CATALOG.filter(m => m.tier === tier);
}
