/**
 * Document Agent V2
 * Playbook ve Contract ile yeniden yazılmış versiyon
 */

import { generateText, streamText } from 'ai';
import { openrouter } from "@/shared/lib/ai/openrouter";
import { DEFAULT_MODEL } from "@/shared/lib/ai/models";
import { BaseAgent } from './base-agent';
import { AgentContract } from './shared-types';
import { documentAgentPlaybook } from '../playbooks/document-agent-playbook';

export interface DocumentAgentInput {
  content: string;
  action: 'summarize' | 'qa' | 'analyze' | 'extract' | 'compare';
  question?: string;
  content2?: string; // compare için
  targetInfo?: string; // extract için
  options?: {
    length?: 'short' | 'medium' | 'long';
    focusAreas?: string[];
  };
}

// Agent Contract oluştur
const documentAgentContract: AgentContract = {
  id: 'document-agent-001',
  name: 'Document Analysis Agent',
  type: 'document',
  status: 'active',
  playbook: documentAgentPlaybook,
  metadata: {
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date(),
    version: '1.0.0',
    author: 'DevAgents Team',
    tags: ['document', 'analysis', 'qa', 'summarization'],
  },
};

export class DocumentAgentV2 extends BaseAgent {
  private model = openrouter(DEFAULT_MODEL);

  constructor() {
    super(documentAgentContract);
  }

  /**
   * Ana execute metodu
   */
  async execute(input: DocumentAgentInput): Promise<string> {
    // Input validation
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Geçersiz girdi: ${validation.errors.join(', ')}`);
    }

    // Capability kontrolü
    if (!this.hasCapability(input.action)) {
      throw new Error(`Bu yetenek desteklenmiyor: ${input.action}`);
    }

    // System prompt oluştur
    const systemPrompt = this.buildSystemPrompt();

    // User prompt oluştur
    const userPrompt = this.buildUserPrompt(input);

    // AI'dan yanıt al
    const { text } = await generateText({
      model: this.model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: this.playbook.behavior.temperature,
    });

    return text;
  }

  /**
   * Streaming execute
   */
  async executeStream(input: DocumentAgentInput) {
    const validation = this.validateInput(input);
    if (!validation.valid) {
      throw new Error(`Geçersiz girdi: ${validation.errors.join(', ')}`);
    }

    if (!this.hasCapability(input.action)) {
      throw new Error(`Bu yetenek desteklenmiyor: ${input.action}`);
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(input);

    return streamText({
      model: this.model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: this.playbook.behavior.temperature,
    });
  }

  /**
   * User prompt oluştur (action'a göre)
   */
  private buildUserPrompt(input: DocumentAgentInput): string {
    switch (input.action) {
      case 'summarize':
        return this.buildSummarizePrompt(input);
      
      case 'analyze':
        return this.buildAnalyzePrompt(input);
      
      case 'qa':
        return this.buildQAPrompt(input);
      
      case 'extract':
        return this.buildExtractPrompt(input);
      
      case 'compare':
        return this.buildComparePrompt(input);
      
      default:
        return input.content;
    }
  }

  private buildSummarizePrompt(input: DocumentAgentInput): string {
    const length = input.options?.length || 'medium';
    const lengthGuide = {
      short: '3-5 cümle',
      medium: '1-2 paragraf',
      long: '3-4 paragraf',
    };

    return `
# Görev: Döküman Özetleme

**Özet Uzunluğu:** ${lengthGuide[length]}

**Döküman İçeriği:**
\`\`\`
${input.content}
\`\`\`

**Talimatlar:**
1. Dökümanın ana konusunu belirle
2. Önemli noktaları çıkar
3. Belirtilen uzunlukta özet oluştur
4. Yapılandırılmış format kullan
`;
  }

  private buildAnalyzePrompt(input: DocumentAgentInput): string {
    const focusAreas = input.options?.focusAreas || [];
    const focusText = focusAreas.length > 0
      ? `\n**Özel Odak Alanları:** ${focusAreas.join(', ')}`
      : '';

    return `
# Görev: Döküman Analizi

**Döküman İçeriği:**
\`\`\`
${input.content}
\`\`\`
${focusText}

**Analiz Kriterleri:**
1. Döküman tipi ve amacı
2. Ana konular ve temalar
3. Önemli bilgiler ve detaylar
4. Güçlü yönler
5. Eksik veya belirsiz noktalar
6. Öneriler (varsa)

Lütfen detaylı bir analiz sun.
`;
  }

  private buildQAPrompt(input: DocumentAgentInput): string {
    return `
# Görev: Soru-Cevap

**Döküman İçeriği:**
\`\`\`
${input.content}
\`\`\`

**Soru:** ${input.question}

**Talimatlar:**
1. Soruyu döküman içeriği bağlamında yanıtla
2. Döküman içinde yanıt varsa kaynak göster
3. Döküman içinde yanıt yoksa bunu açıkça belirt
4. Gerekirse örneklerle destekle
`;
  }

  private buildExtractPrompt(input: DocumentAgentInput): string {
    return `
# Görev: Bilgi Çıkarma

**Döküman İçeriği:**
\`\`\`
${input.content}
\`\`\`

**Çıkarılacak Bilgi:** ${input.targetInfo}

**Talimatlar:**
1. Belirtilen bilgiyi döküman içinden bul
2. İlgili bölümleri listele
3. Bulunamazsa bunu belirt
4. Yapılandırılmış format kullan
`;
  }

  private buildComparePrompt(input: DocumentAgentInput): string {
    return `
# Görev: Döküman Karşılaştırma

**Döküman 1:**
\`\`\`
${input.content}
\`\`\`

**Döküman 2:**
\`\`\`
${input.content2 || ''}
\`\`\`

**Karşılaştırma Kriterleri:**
1. Benzerlikler
2. Farklılıklar
3. Her birinin güçlü yönleri
4. Her birinin eksik yönleri
5. Genel değerlendirme
`;
  }

  /**
   * GitHub README analizi için özel metod
   */
  async analyzeGitHubReadme(readmeContent: string) {
    return this.execute({
      content: readmeContent,
      action: 'analyze',
      options: {
        focusAreas: ['proje amacı', 'özellikler', 'kurulum', 'kullanım', 'katkı'],
      },
    });
  }
}

// Singleton instance
export const documentAgentV2 = new DocumentAgentV2();

