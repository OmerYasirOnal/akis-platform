# 🤖 Agent System - Playbook & Contract Architecture

## Mimari Genel Bakış

DevAgents platformu, **Agent Contract** ve **Agent Playbook** konseptleri üzerine kurulmuştur. Bu yapı, her agent'ın yeteneklerini, kurallarını ve davranışlarını merkezi bir şekilde tanımlar.

## Temel Kavramlar

### 1. Agent Contract
Agent'ın kimlik kartı ve yasal sözleşmesidir. İçerir:
- Agent ID ve metadata
- Playbook referansı
- Durum bilgisi (active/inactive)
- Performans metrikleri

### 2. Agent Playbook
Agent'ın "kullanım kılavuzu"dur. İçerir:
- **Mission**: Agent'ın ana misyonu
- **Capabilities**: Neler yapabilir?
- **Rules**: Hangi kurallara uyar?
- **Behavior**: Nasıl davranır?
- **Tools**: Hangi araçları kullanabilir?
- **Examples**: Öğretici örnekler
- **Constraints**: Kısıtlamalar

## Dosya Yapısı

```
src/lib/agents/
├── types.ts                          # Type tanımları
├── base-agent.ts                     # BaseAgent sınıfı (tüm agent'lar miras alır)
├── playbooks/
│   ├── document-agent-playbook.ts    # Document Agent'ın playbook'u
│   └── qa-agent-playbook.ts          # (gelecek) QA Agent playbook
├── document-agent-v2.ts              # Document Agent implementasyonu
└── document-agent.ts                 # (eski versiyon, deprecated)
```

## Document Agent Playbook Örneği

```typescript
export const documentAgentPlaybook: AgentPlaybook = {
  agentId: 'document-agent-v1',
  agentName: 'Document Analysis Agent',
  version: '1.0.0',
  
  mission: `
    Sen bir uzman döküman analiz asistanısın...
  `,
  
  capabilities: [
    {
      id: 'summarize',
      name: 'Döküman Özetleme',
      description: 'Uzun dökümanları özetler',
    },
    {
      id: 'analyze',
      name: 'Döküman Analizi',
      description: 'İçeriği analiz eder',
    },
    // ... daha fazla
  ],
  
  rules: [
    {
      id: 'accuracy',
      description: 'Her zaman doğru bilgi ver',
      priority: 'high',
    },
    {
      id: 'no-hallucination',
      description: 'Uydurma yapma',
      priority: 'high',
    },
    // ... daha fazla
  ],
  
  behavior: {
    responseStyle: 'technical',
    temperature: 0.3,
    maxTokens: 2000,
  },
};
```

## Yeni Agent Ekleme

### Adım 1: Playbook Oluştur

```typescript
// src/lib/agents/playbooks/my-agent-playbook.ts
export const myAgentPlaybook: AgentPlaybook = {
  agentId: 'my-agent-v1',
  agentName: 'My Custom Agent',
  version: '1.0.0',
  
  mission: 'Agent misyonu...',
  
  capabilities: [
    {
      id: 'do-something',
      name: 'Bir Şey Yap',
      description: 'Açıklama...',
    },
  ],
  
  rules: [
    {
      id: 'rule-1',
      description: 'Kural 1',
      priority: 'high',
    },
  ],
  
  behavior: {
    responseStyle: 'casual',
    temperature: 0.7,
    maxTokens: 1000,
  },
  
  systemPromptTemplate: `
    Sen {{agentName}} adlı bir AI agent'sın.
    
    Yeteneklerin:
    {{capabilities}}
    
    Kuralların:
    {{rules}}
  `,
};
```

### Adım 2: Agent Sınıfı Oluştur

```typescript
// src/lib/agents/my-agent.ts
import { BaseAgent } from './base-agent';
import { myAgentPlaybook } from './playbooks/my-agent-playbook';

export class MyAgent extends BaseAgent {
  constructor() {
    const contract = {
      id: 'my-agent-001',
      name: 'My Custom Agent',
      type: 'custom',
      status: 'active',
      playbook: myAgentPlaybook,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
      },
    };
    
    super(contract);
  }
  
  async execute(input: any): Promise<any> {
    // Validation
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Invalid input: ${validation.errors}`);
    }
    
    // System prompt oluştur (playbook'tan)
    const systemPrompt = this.buildSystemPrompt();
    
    // AI çağrısı yap
    // ...
    
    return result;
  }
}
```

### Adım 3: API Endpoint Ekle

```typescript
// src/app/api/agent/my-agent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { myAgent } from '@/lib/agents/my-agent';

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  const result = await myAgent.execute(body);
  
  return NextResponse.json({ result });
}
```

## Agent Capabilities (Yetenekler)

Her capability şunları içerir:
- `id`: Unique tanımlayıcı
- `name`: İnsan okunabilir isim
- `description`: Ne yaptığı
- `parameters`: Hangi parametreleri alır

Örnek:
```typescript
{
  id: 'summarize',
  name: 'Döküman Özetleme',
  description: 'Uzun dökümanları kısa özetler',
  parameters: {
    content: {
      type: 'string',
      required: true,
      description: 'Özetlenecek içerik',
    },
    length: {
      type: 'enum[short,medium,long]',
      required: false,
      description: 'Özet uzunluğu',
    },
  },
}
```

## Agent Rules (Kurallar)

Kurallar 3 priority level'a sahiptir:
- **high**: Kritik, mutlaka uyulmalı
- **medium**: Önemli, mümkün olduğunca uyulmalı
- **low**: İyi olur, ama opsiyonel

Örnek:
```typescript
{
  id: 'no-hallucination',
  description: 'Döküman içinde olmayan bilgileri asla uydurma',
  priority: 'high',
  enforceable: true,
}
```

## Agent Behavior (Davranış)

Agent'ın ton, stil ve parametrelerini tanımlar:

```typescript
{
  responseStyle: 'technical',  // formal | casual | technical
  language: 'tr',              // tr | en
  maxTokens: 2000,             // Maksimum token
  temperature: 0.3,            // 0-1 arası (düşük = deterministik)
  shouldExplain: true,         // Açıklama yapmalı mı?
  shouldProvideExamples: true, // Örnek vermeli mi?
}
```

## System Prompt Oluşturma

BaseAgent otomatik olarak playbook'tan system prompt oluşturur:

```typescript
const systemPrompt = this.buildSystemPrompt();
// Playbook içindeki template'i kullanır
// {{mission}}, {{capabilities}}, {{rules}} gibi placeholders'ı doldurur
```

## Agent Info API

Agent bilgilerini görüntüleme:

```bash
GET /api/agent/info?agentId=document-agent-001
```

Response:
```json
{
  "success": true,
  "agent": {
    "id": "document-agent-001",
    "name": "Document Analysis Agent",
    "type": "document",
    "version": "1.0.0",
    "capabilities": [...],
    "rules": [...]
  }
}
```

## UI'da Görüntüleme

Dashboard'da `AgentPlaybookViewer` component'i ile agent bilgilerini göster:

```tsx
import { AgentPlaybookViewer } from '@/components/AgentPlaybookViewer';

<AgentPlaybookViewer />
```

## Avantajlar

✅ **Merkezi Yönetim**: Tüm agent davranışları tek yerde
✅ **Type Safety**: TypeScript ile tip güvenliği
✅ **Ölçeklenebilir**: Yeni agent eklemek kolay
✅ **Tutarlılık**: Tüm agent'lar aynı pattern'i takip eder
✅ **Test Edilebilir**: Her capability ayrı test edilebilir
✅ **Dokümante**: Playbook kendisi bir dokümantasyon
✅ **Versiyonlanabilir**: Her agent versiyonlanabilir

## Sonraki Adımlar

1. **Multi-Agent Orchestration**: Agent'lar arası iletişim
2. **Tool Integration**: Agent'ların external tool kullanması
3. **Memory System**: Agent'ların önceki konuşmaları hatırlaması
4. **Agent Marketplace**: Hazır playbook'lar paylaşma
5. **Visual Playbook Editor**: No-code playbook oluşturma

## Örnek Kullanım

```typescript
import { documentAgentV2 } from '@/lib/agents/document-agent-v2';

// Agent bilgilerini al
const info = documentAgentV2.getInfo();
console.log(info.capabilities); // Tüm yetenekleri listeler

// Agent'ı kullan
const result = await documentAgentV2.execute({
  content: 'Döküman içeriği...',
  action: 'summarize',
});
```

---

**Not:** Bu sistem, LangChain/LangGraph agent pattern'larından esinlenmiştir ve production-ready bir yapıya sahiptir.

