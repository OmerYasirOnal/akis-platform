import { chatCompletion } from './OpenAIClient.js';
import { PROMPTS } from './PromptTemplates.js';

export interface PersonaContext {
  platform: string;
  language: 'tr' | 'en';
  formality: 'casual' | 'professional' | 'formal';
  jobTitle?: string;
  companyName?: string;
  clientName?: string;
}

export class PersonaEngine {
  private systemPrompt: string;

  constructor(customSystemPrompt?: string) {
    this.systemPrompt = customSystemPrompt ?? PROMPTS.PERSONA_SYSTEM;
  }

  async generateMessage(
    task: string,
    context: PersonaContext,
    additionalContext?: string,
  ): Promise<string> {
    const languageInstruction = context.language === 'tr'
      ? 'Write your response in Turkish.'
      : 'Write your response in English.';

    const formalityInstruction = context.formality === 'casual'
      ? 'Use a casual, friendly tone appropriate for freelance platforms.'
      : context.formality === 'formal'
        ? 'Use a formal, professional tone appropriate for corporate applications.'
        : 'Use a professional but approachable tone.';

    const platformInstruction = `This message is for ${context.platform}.`;

    const contextInfo = [
      context.jobTitle ? `Job title: ${context.jobTitle}` : '',
      context.companyName ? `Company: ${context.companyName}` : '',
      context.clientName ? `Client name: ${context.clientName}` : '',
      additionalContext ?? '',
    ].filter(Boolean).join('\n');

    const userPrompt = `${task}

${languageInstruction}
${formalityInstruction}
${platformInstruction}

Context:
${contextInfo}`;

    return chatCompletion(this.systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 800,
    });
  }

  async adaptTemplate(
    template: string,
    replacements: Record<string, string>,
    context: PersonaContext,
  ): Promise<string> {
    let result = template;
    for (const [key, value] of Object.entries(replacements)) {
      result = result.replaceAll(`[${key}]`, value);
    }

    if (result.includes('[') && result.includes(']')) {
      const instruction = context.language === 'tr'
        ? 'Aşağıdaki şablondaki [PLACEHOLDER] değerlerini uygun şekilde doldur. Doğal ve kişiselleştirilmiş bir metin oluştur.'
        : 'Fill in the remaining [PLACEHOLDER] values in the template below. Make it natural and personalized.';

      return chatCompletion(this.systemPrompt, `${instruction}\n\nTemplate:\n${result}`, {
        temperature: 0.5,
        maxTokens: 800,
      });
    }

    return result;
  }
}
