/**
 * Document Agent
 * Döküman analizi, özet çıkarma, soru-cevap işlemleri yapar
 */

import { generateText, streamText } from 'ai';
import { openrouter } from "@/shared/lib/ai/openrouter";
import { DEFAULT_MODEL } from "@/shared/lib/ai/models";

export interface DocumentAgentInput {
  content: string;
  action: 'summarize' | 'qa' | 'analyze';
  question?: string;
}

export class DocumentAgent {
  private model = openrouter(DEFAULT_MODEL);

  /**
   * Döküman işleme (sync)
   */
  async process(input: DocumentAgentInput): Promise<string> {
    const systemPrompt = this.getSystemPrompt(input.action);
    const userPrompt = this.getUserPrompt(input);

    const { text } = await generateText({
      model: this.model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    return text;
  }

  /**
   * Döküman işleme (streaming)
   */
  async processStream(input: DocumentAgentInput) {
    const systemPrompt = this.getSystemPrompt(input.action);
    const userPrompt = this.getUserPrompt(input);

    return streamText({
      model: this.model,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });
  }

  private getSystemPrompt(action: DocumentAgentInput['action']): string {
    const prompts = {
      summarize: `Sen bir döküman özetleme uzmanısın. Verilen metni önemli noktaları vurgulayarak, anlaşılır bir şekilde özetle. Türkçe yanıt ver.`,
      
      qa: `Sen bir döküman soru-cevap asistanısın. Verilen döküman içeriğine dayanarak kullanıcının sorusunu yanıtla. Eğer döküman içeriğinde yanıt yoksa bunu belirt. Türkçe yanıt ver.`,
      
      analyze: `Sen bir döküman analiz uzmanısın. Verilen dökümanı şu açılardan analiz et:
- Ana konular ve temalar
- Önemli bilgiler
- Eksik ya da belirsiz noktalar
- Öneriler
Türkçe yanıt ver.`,
    };

    return prompts[action];
  }

  private getUserPrompt(input: DocumentAgentInput): string {
    switch (input.action) {
      case 'summarize':
        return `Aşağıdaki dökümanı özetle:\n\n${input.content}`;
      
      case 'qa':
        return `Döküman içeriği:\n${input.content}\n\nSoru: ${input.question}`;
      
      case 'analyze':
        return `Aşağıdaki dökümanı analiz et:\n\n${input.content}`;
      
      default:
        return input.content;
    }
  }

  /**
   * GitHub README analizi
   */
  async analyzeGitHubReadme(readmeContent: string) {
    return this.process({
      content: readmeContent,
      action: 'analyze',
    });
  }
}

// Singleton instance
export const documentAgent = new DocumentAgent();

