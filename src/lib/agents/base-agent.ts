/**
 * Base Agent Class
 * Tüm agent'ların miras alacağı temel sınıf
 */

import { generateText, streamText } from 'ai';
import { AgentContract, AgentPlaybook } from './types';

export abstract class BaseAgent {
  protected contract: AgentContract;
  protected playbook: AgentPlaybook;

  constructor(contract: AgentContract) {
    this.contract = contract;
    this.playbook = contract.playbook;
  }

  /**
   * System prompt'u playbook'tan oluştur
   */
  protected buildSystemPrompt(): string {
    let prompt = this.playbook.systemPromptTemplate;

    // Mission'ı ekle
    prompt = prompt.replace('{{mission}}', this.playbook.mission.trim());

    // Capabilities'i listele
    const capabilitiesText = this.playbook.capabilities
      .map((cap, idx) => `${idx + 1}. **${cap.name}**: ${cap.description}`)
      .join('\n');
    prompt = prompt.replace('{{capabilities}}', capabilitiesText);

    // Rules'u listele
    const rulesText = this.playbook.rules
      .sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return priority[a.priority] - priority[b.priority];
      })
      .map((rule, idx) => `${idx + 1}. [${rule.priority.toUpperCase()}] ${rule.description}`)
      .join('\n');
    prompt = prompt.replace('{{rules}}', rulesText);

    // Examples'ı ekle (varsa)
    if (this.playbook.examples && this.playbook.examples.length > 0) {
      const examplesText = this.playbook.examples
        .map((ex, idx) => `
### Örnek ${idx + 1}:
**Giriş:** ${ex.input}
**Beklenen Çıktı:** ${ex.expectedOutput}
**Açıklama:** ${ex.explanation}
        `)
        .join('\n');
      prompt = prompt.replace('{{examples}}', examplesText);
    } else {
      prompt = prompt.replace('{{examples}}', 'Örnekler mevcut değil.');
    }

    return prompt;
  }

  /**
   * Input validation
   */
  protected validateInput(input: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Constraint kontrolü
    if (this.playbook.constraints?.maxInputLength) {
      const inputLength = JSON.stringify(input).length;
      if (inputLength > this.playbook.constraints.maxInputLength) {
        errors.push(`Girdi çok uzun (max: ${this.playbook.constraints.maxInputLength} karakter)`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Capability kontrolü
   */
  protected hasCapability(capabilityId: string): boolean {
    return this.playbook.capabilities.some(cap => cap.id === capabilityId);
  }

  /**
   * Agent bilgilerini al
   */
  public getInfo() {
    return {
      id: this.contract.id,
      name: this.contract.name,
      type: this.contract.type,
      version: this.playbook.version,
      description: this.playbook.description,
      capabilities: this.playbook.capabilities.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
      })),
      rules: this.playbook.rules.map(r => ({
        id: r.id,
        description: r.description,
        priority: r.priority,
      })),
    };
  }

  /**
   * Abstract method - her agent kendi implement eder
   */
  abstract execute(input: any): Promise<any>;
}

