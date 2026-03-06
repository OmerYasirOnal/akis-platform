import type {
  ScribeInput,
  ScribeOutput,
  ScribeClarification,
  ScribeMessageType,
  StructuredSpec,
} from '../../core/contracts/PipelineTypes.js';
import {
  ScribeOutputSchema,
  ScribeClarificationSchema,
} from '../../core/contracts/PipelineSchemas.js';
import {
  PipelineErrorCode,
  createPipelineError,
  RETRY_CONFIG,
} from '../../core/contracts/PipelineErrors.js';
import type { PipelineError } from '../../core/contracts/PipelineTypes.js';
import { isSpecMinimallyValid } from './SpecContract.js';

// ─── Types ────────────────────────────────────────

export interface ScribeAIDeps {
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;
}

export interface ScribeState {
  idea: string;
  context?: string;
  targetStack?: string;
  conversation: ScribeMessageType[];
  clarificationRound: number;
  phase: 'clarifying' | 'generating' | 'done';
}

export type ScribeResult =
  | { type: 'clarification'; data: ScribeClarification }
  | { type: 'spec'; data: ScribeOutput }
  | { type: 'error'; error: PipelineError };

// ─── Constants ────────────────────────────────────

const MAX_CLARIFICATION_ROUNDS = 3;

const CLARIFICATION_SYSTEM_PROMPT = `You are Scribe, a conversational spec writer for a software project pipeline.

Your task is to analyze the user's project idea and determine what additional information is needed to create a comprehensive software specification.

Instructions:
1. Analyze the idea and identify missing REQUIRED information:
   - Core purpose (what will the app do?)
   - Target users (who will use it?)
   - MVP features (first version scope)
   - Technology preference (if any)

2. Identify missing OPTIONAL information:
   - Authentication type
   - Database preference
   - Third-party integrations
   - Deployment target (web, mobile, desktop)

3. If the idea is clear and detailed enough, respond with {"ready": true} to skip directly to spec generation.

4. If clarification is needed, generate 2-4 grouped questions. Each question must include:
   - A unique ID
   - The question text (in Turkish)
   - Why you're asking (brief reason, in Turkish)
   - Optional suggested answers

Output Format - respond ONLY with valid JSON:

If clarification needed:
{"ready": false, "questions": [{"id": "q1", "question": "...", "reason": "...", "suggestions": ["...", "..."]}]}

If ready to generate spec:
{"ready": true}

Rules:
- Questions must be in Turkish
- Do NOT assume the user's technical knowledge level
- Do NOT judge the idea
- Group related questions together
- Maximum 4 questions per round`;

const SPEC_GENERATION_SYSTEM_PROMPT = `You are Scribe, a conversational spec writer for a software project pipeline.

Your task is to generate a comprehensive, structured software specification from the user's idea and any clarification answers.

Generate a StructuredSpec with these fields:
1. title: Concise project name (3-8 words)
2. problemStatement: What problem does this solve? (2-4 sentences)
3. userStories: Array of {persona, action, benefit} — minimum 1
4. acceptanceCriteria: Array of {id, given, when, then} — minimum 1, IDs like "ac-1"
5. technicalConstraints: {stack?, integrations?, nonFunctional?}
6. outOfScope: What this MVP will NOT include

Also generate:
- rawMarkdown: Human-readable markdown version of the spec
- confidence: 0-1 score based on information completeness
- clarificationsAsked: number of clarification rounds completed

Respond ONLY with valid JSON matching this structure:
{
  "spec": { "title": "...", "problemStatement": "...", "userStories": [...], "acceptanceCriteria": [...], "technicalConstraints": {...}, "outOfScope": [...] },
  "rawMarkdown": "...",
  "confidence": 0.85,
  "clarificationsAsked": 2
}

Rules:
- Spec content should be in Turkish
- rawMarkdown should be human-readable Turkish
- Be specific and actionable
- Do NOT add features the user didn't mention
- Keep MVP scope tight`;

// ─── ScribeAgent ──────────────────────────────────

export class ScribeAgent {
  private ai: ScribeAIDeps;

  constructor(ai: ScribeAIDeps) {
    this.ai = ai;
  }

  createInitialState(input: ScribeInput): ScribeState {
    return {
      idea: input.idea,
      context: input.context,
      targetStack: input.targetStack,
      conversation: [{ type: 'user_idea', content: input.idea }],
      clarificationRound: 0,
      phase: 'clarifying',
    };
  }

  async analyzIdea(state: ScribeState): Promise<ScribeResult> {
    if (state.clarificationRound >= MAX_CLARIFICATION_ROUNDS) {
      return this.generateSpec(state);
    }

    const userPrompt = this.buildClarificationUserPrompt(state);

    let responseText: string;
    try {
      responseText = await this.ai.generateText(CLARIFICATION_SYSTEM_PROMPT, userPrompt);
    } catch {
      return {
        type: 'error',
        error: createPipelineError(PipelineErrorCode.AI_PROVIDER_ERROR, 'Clarification AI call failed'),
      };
    }

    let parsed: { ready: boolean; questions?: ScribeClarification['questions'] };
    try {
      parsed = JSON.parse(this.extractJson(responseText));
    } catch {
      return {
        type: 'error',
        error: createPipelineError(PipelineErrorCode.AI_INVALID_RESPONSE, 'Invalid JSON from clarification'),
      };
    }

    if (parsed.ready) {
      return this.generateSpec(state);
    }

    const clarificationResult = ScribeClarificationSchema.safeParse({
      questions: parsed.questions,
    });

    if (!clarificationResult.success) {
      return this.generateSpec(state);
    }

    const clarification = clarificationResult.data;
    state.conversation.push({ type: 'clarification', content: clarification });
    state.clarificationRound++;

    return { type: 'clarification', data: clarification };
  }

  processUserAnswer(state: ScribeState, answer: string): void {
    state.conversation.push({ type: 'user_answer', content: answer });
  }

  async continueAfterAnswer(state: ScribeState): Promise<ScribeResult> {
    return this.analyzIdea(state);
  }

  async generateSpec(state: ScribeState): Promise<ScribeResult> {
    state.phase = 'generating';
    const userPrompt = this.buildSpecGenerationUserPrompt(state);

    for (let attempt = 0; attempt <= RETRY_CONFIG.specValidationMaxRetries; attempt++) {
      let responseText: string;
      try {
        responseText = await this.ai.generateText(SPEC_GENERATION_SYSTEM_PROMPT, userPrompt);
      } catch {
        if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
        return {
          type: 'error',
          error: createPipelineError(PipelineErrorCode.AI_PROVIDER_ERROR, 'Spec generation AI call failed'),
        };
      }

      let rawParsed: unknown;
      try {
        rawParsed = JSON.parse(this.extractJson(responseText));
      } catch {
        if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
        return {
          type: 'error',
          error: createPipelineError(PipelineErrorCode.AI_INVALID_RESPONSE, 'Invalid JSON from spec generation'),
        };
      }

      const outputResult = ScribeOutputSchema.safeParse(rawParsed);
      if (!outputResult.success) {
        if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
        return {
          type: 'error',
          error: createPipelineError(
            PipelineErrorCode.SCRIBE_SPEC_VALIDATION_FAILED,
            `Schema validation failed: ${outputResult.error.issues.map((i) => i.message).join(', ')}`
          ),
        };
      }

      const scribeOutput = outputResult.data;
      scribeOutput.clarificationsAsked = state.clarificationRound;

      const specCheck = isSpecMinimallyValid(scribeOutput.spec);
      if (!specCheck.valid) {
        if (attempt < RETRY_CONFIG.specValidationMaxRetries) continue;
        return {
          type: 'error',
          error: createPipelineError(
            PipelineErrorCode.SCRIBE_SPEC_VALIDATION_FAILED,
            `Minimum requirements not met: ${specCheck.issues.join(', ')}`
          ),
        };
      }

      state.phase = 'done';
      state.conversation.push({ type: 'spec_draft', content: scribeOutput });
      return { type: 'spec', data: scribeOutput };
    }

    return {
      type: 'error',
      error: createPipelineError(PipelineErrorCode.SCRIBE_SPEC_VALIDATION_FAILED, 'All retries exhausted'),
    };
  }

  async regenerateSpec(state: ScribeState, feedback: string): Promise<ScribeResult> {
    state.conversation.push({ type: 'spec_rejected', content: { feedback } });
    state.phase = 'generating';
    return this.generateSpec(state);
  }

  // ─── Private Helpers ──────────────────────────────

  private buildClarificationUserPrompt(state: ScribeState): string {
    const parts: string[] = [
      `Kullanıcının fikri: "${state.idea}"`,
    ];

    if (state.context) {
      parts.push(`Ek bağlam: ${state.context}`);
    }
    if (state.targetStack) {
      parts.push(`Teknoloji tercihi: ${state.targetStack}`);
    }

    parts.push(`Mevcut tur: ${state.clarificationRound + 1} / ${MAX_CLARIFICATION_ROUNDS}`);

    const previousQA = this.extractPreviousQA(state.conversation);
    if (previousQA.length > 0) {
      parts.push(`\nÖnceki sorular ve cevaplar:\n${previousQA}`);
    }

    return parts.join('\n');
  }

  private buildSpecGenerationUserPrompt(state: ScribeState): string {
    const parts: string[] = [
      `Kullanıcının fikri: "${state.idea}"`,
      `Tamamlanan soru turları: ${state.clarificationRound}`,
    ];

    if (state.context) {
      parts.push(`Ek bağlam: ${state.context}`);
    }
    if (state.targetStack) {
      parts.push(`Teknoloji tercihi: ${state.targetStack}`);
    }

    const previousQA = this.extractPreviousQA(state.conversation);
    if (previousQA.length > 0) {
      parts.push(`\nTüm konuşma geçmişi:\n${previousQA}`);
    }

    return parts.join('\n');
  }

  private extractPreviousQA(conversation: ScribeMessageType[]): string {
    const lines: string[] = [];
    for (const msg of conversation) {
      if (msg.type === 'clarification') {
        for (const q of msg.content.questions) {
          lines.push(`S: ${q.question} (Neden: ${q.reason})`);
        }
      } else if (msg.type === 'user_answer') {
        lines.push(`C: ${msg.content}`);
      }
    }
    return lines.join('\n');
  }

  private extractJson(text: string): string {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return fenced[1].trim();

    const braceStart = text.indexOf('{');
    const braceEnd = text.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd > braceStart) {
      return text.slice(braceStart, braceEnd + 1);
    }

    return text.trim();
  }
}
