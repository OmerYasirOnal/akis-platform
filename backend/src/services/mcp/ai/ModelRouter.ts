export type AgentType = 'scribe' | 'trace' | 'proto';
export type ModelPlan = 'free' | 'premium';

export interface ModelDescriptor {
  id: string;
  label: string;
  description: string;
  contextWindow: number;
  plan: ModelPlan;
  recommendedFor: AgentType[];
  provider: string;
  supportsStreaming: boolean;
  supportsToolUse: boolean;
  contextClass: 'standard' | 'large' | 'ultra';
  privacy: string;
  notes?: string;
  pricingHint?: string;
  requiresConsent?: boolean;
}

export interface ModelRouterConfig {
  defaults: Record<AgentType, string>;
  models: ModelDescriptor[];
  fallbacks?: Record<string, string[]>;
}

export class ModelRouter {
  private readonly models: Map<string, ModelDescriptor>;
  private readonly defaults: Record<AgentType, string>;
  private readonly fallbacks: Map<string, string[]>;

  constructor(config: ModelRouterConfig) {
    this.models = new Map(config.models.map((model) => [model.id, model]));
    this.defaults = config.defaults;
    this.fallbacks = new Map(Object.entries(config.fallbacks ?? {}));
  }

  list(plan: ModelPlan | 'all' = 'all'): ModelDescriptor[] {
    const items = Array.from(this.models.values());
    if (plan === 'all') {
      return items;
    }
    return items.filter((model) => model.plan === plan);
  }

  resolve(agent: AgentType, requestedModelId?: string): ModelDescriptor {
    if (requestedModelId) {
      const model = this.models.get(requestedModelId);
      if (!model) {
        throw new Error(`Model "${requestedModelId}" is not in the allow-list`);
      }
      return model;
    }

    const defaultId = this.defaults[agent];
    const model = this.models.get(defaultId);
    if (!model) {
      throw new Error(`Default model "${defaultId}" for agent "${agent}" is not available`);
    }
    return model;
  }

  getById(modelId: string): ModelDescriptor | undefined {
    return this.models.get(modelId);
  }

  fallbackChain(modelId: string): string[] {
    return this.fallbacks.get(modelId) ?? [];
  }
}

export function buildDefaultModelRouter(
  overrides?: Partial<Record<AgentType, string>>
): ModelRouter {
  const models: ModelDescriptor[] = [
    {
      id: 'deepseek/deepseek-r1:free',
      label: 'DeepSeek R1 (Free)',
      description:
        'Reasoning odaklı 163k bağlamlı model; teknik dokümantasyon ve özetleme için optimize edilmiştir.',
      contextWindow: 163000,
      plan: 'free',
      recommendedFor: ['scribe'],
      provider: 'DeepSeek · OpenRouter',
      supportsStreaming: true,
      supportsToolUse: false,
      contextClass: 'large',
      privacy: 'Veri saklama bilgisi için DeepSeek OpenRouter politikalarına bakın.',
      notes: 'Dokümantasyon güncellemeleri ve açıklayıcı özetler için önerilir.',
      pricingHint: 'Free tier · Balanced reasoning + efficiency',
    },
    {
      id: 'qwen/qwen3-coder:free',
      label: 'Qwen 3 Coder (Free)',
      description:
        '262k tokenlık bağlam ile kod üretimi ve test senaryosu oluşturmada güçlü bir yardımcı.',
      contextWindow: 262000,
      plan: 'free',
      recommendedFor: ['trace', 'proto'],
      provider: 'Qwen · OpenRouter',
      supportsStreaming: true,
      supportsToolUse: true,
      contextClass: 'ultra',
      privacy: 'Alibaba Cloud log politikalarına tabi; hassas veri gönderirken dikkatli olun.',
      notes: 'Test senaryosu üretimi ve prototipleme için yüksek bağlamlı varsayılan.',
      pricingHint: 'Free tier · Optimised for code comprehension',
    },
    {
      id: 'mistralai/mistral-nemo:free',
      label: 'Mistral Nemo (Free)',
      description:
        '128k bağlamlı genel amaçlı model; hız ve güvenilirlik için istikrarlı bir yedek.',
      contextWindow: 128000,
      plan: 'free',
      recommendedFor: ['scribe', 'trace', 'proto'],
      provider: 'Mistral · OpenRouter',
      supportsStreaming: true,
      supportsToolUse: false,
      contextClass: 'large',
      privacy: 'Mistral Cloud log saklar; hassas verileri maskeyin.',
      notes: 'Diğer sağlayıcılar hata verdiğinde otomatik yedek model.',
      pricingHint: 'Free tier · Reliable fallback',
    },
    {
      id: 'anthropic/claude-3.5-sonnet',
      label: 'Claude 3.5 Sonnet',
      description:
        '200k bağlamlı premium model; çapraz repo analizi ve tasarım kararları için ideal.',
      contextWindow: 200000,
      plan: 'premium',
      recommendedFor: ['scribe', 'trace', 'proto'],
      provider: 'Anthropic · OpenRouter',
      supportsStreaming: true,
      supportsToolUse: true,
      contextClass: 'large',
      privacy: 'Anthropic deneysel girişleri kaydedebilir; premium kullanım onayı gerekir.',
      notes: 'Premium içerik; kullanmadan önce bilgilendirilmiş onay alın.',
      pricingHint: 'Premium · Anthropic fiyatlandırması uygulanır',
      requiresConsent: true,
    },
    {
      id: 'openai/gpt-4.1',
      label: 'OpenAI GPT-4.1',
      description: '128k bağlamlı premium model; prototip ve ürün stratejisinde güçlü.',
      contextWindow: 128000,
      plan: 'premium',
      recommendedFor: ['proto'],
      provider: 'OpenAI · OpenRouter',
      supportsStreaming: true,
      supportsToolUse: true,
      contextClass: 'large',
      privacy: 'OpenAI güvenlik incelemesi için promptları tutabilir; premium onayı gerekir.',
      notes: 'Geniş araç entegrasyonu gerektiren premium görevlerde kullanın.',
      pricingHint: 'Premium · OpenAI fiyatlandırması uygulanır',
      requiresConsent: true,
    },
  ];

  const defaults: Record<AgentType, string> = {
    scribe: 'deepseek/deepseek-r1:free',
    trace: 'qwen/qwen3-coder:free',
    proto: 'qwen/qwen3-coder:free',
  };

  const fallbackMap: Record<string, string[]> = {
    'deepseek/deepseek-r1:free': ['mistralai/mistral-nemo:free'],
    'qwen/qwen3-coder:free': ['mistralai/mistral-nemo:free'],
    'mistralai/mistral-nemo:free': [],
    'anthropic/claude-3.5-sonnet': ['deepseek/deepseek-r1:free', 'mistralai/mistral-nemo:free'],
    'openai/gpt-4.1': ['qwen/qwen3-coder:free', 'mistralai/mistral-nemo:free'],
  };

  const mergedDefaults: Record<AgentType, string> = {
    scribe: overrides?.scribe ?? defaults.scribe,
    trace: overrides?.trace ?? defaults.trace,
    proto: overrides?.proto ?? defaults.proto,
  };

  return new ModelRouter({ models, defaults: mergedDefaults, fallbacks: fallbackMap });
}
