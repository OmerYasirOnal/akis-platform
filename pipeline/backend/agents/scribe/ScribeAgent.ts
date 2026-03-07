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

CRITICAL: All array fields MUST be JSON arrays [], never strings. Follow the exact structure below.

Respond ONLY with valid JSON matching this EXACT structure:
{
  "spec": {
    "title": "Proje Başlığı (3-8 kelime)",
    "problemStatement": "Bu proje şu sorunu çözüyor... (2-4 cümle)",
    "userStories": [
      {"persona": "Son kullanıcı", "action": "Uygulamaya giriş yapabilmeli", "benefit": "Kişiselleştirilmiş deneyim sunulması"},
      {"persona": "Yönetici", "action": "Kullanıcıları yönetebilmeli", "benefit": "Sistem kontrolü sağlanması"}
    ],
    "acceptanceCriteria": [
      {"id": "ac-1", "given": "Kullanıcı giriş sayfasında", "when": "Email ve şifre girip submit ettiğinde", "then": "Dashboard'a yönlendirilir"},
      {"id": "ac-2", "given": "Kullanıcı kayıtlı değilse", "when": "Kayıt formunu doldurduğunda", "then": "Hesap oluşturulur ve doğrulama emaili gönderilir"}
    ],
    "technicalConstraints": {
      "stack": "React + Node.js",
      "integrations": ["GitHub API", "OAuth 2.0"],
      "nonFunctional": ["Response time < 2s", "Mobile responsive"]
    },
    "outOfScope": ["Admin paneli", "Ödeme sistemi", "Mobil uygulama"]
  },
  "rawMarkdown": "# Proje Başlığı\\n\\n## Problem\\n...\\n\\n## User Stories\\n...\\n\\n## Kabul Kriterleri\\n...",
  "confidence": 0.85,
  "clarificationsAsked": 0
}

IMPORTANT RULES:
- "userStories" MUST be a JSON ARRAY of objects with "persona", "action", "benefit" keys
- "acceptanceCriteria" MUST be a JSON ARRAY of objects with "id", "given", "when", "then" keys
- "outOfScope" MUST be a JSON ARRAY of strings
- "integrations" and "nonFunctional" MUST be JSON ARRAYS of strings (or omitted)
- Spec content should be in Turkish
- rawMarkdown should be human-readable Turkish
- Be specific and actionable
- Do NOT add features the user didn't mention
- Keep MVP scope tight
- NEVER return string values where arrays are expected`;

// ─── AI Response Normalization ───────────────────

/**
 * Normalizes raw AI JSON to fix common output mistakes before Zod validation.
 * Handles: string-instead-of-array, flat string userStories/acceptanceCriteria.
 */
function normalizeSpecResponse(raw: Record<string, unknown>): Record<string, unknown> {
  const spec = (raw.spec ?? raw) as Record<string, unknown>;

  // userStories: should be [{persona, action, benefit}, ...]
  if (typeof spec.userStories === 'string') {
    try {
      const parsed = JSON.parse(spec.userStories as string);
      spec.userStories = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      spec.userStories = [
        { persona: 'Kullanıcı', action: spec.userStories, benefit: 'Belirtilmedi' },
      ];
    }
  }

  // acceptanceCriteria: should be [{id, given, when, then}, ...]
  if (typeof spec.acceptanceCriteria === 'string') {
    try {
      const parsed = JSON.parse(spec.acceptanceCriteria as string);
      spec.acceptanceCriteria = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      spec.acceptanceCriteria = [
        { id: 'ac-1', given: 'Sistem hazır', when: spec.acceptanceCriteria, then: 'Belirtilmedi' },
      ];
    }
  }

  // outOfScope: should be string[]
  if (typeof spec.outOfScope === 'string') {
    try {
      const parsed = JSON.parse(spec.outOfScope as string);
      spec.outOfScope = Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      spec.outOfScope = [(spec.outOfScope as string)];
    }
  }
  if (!Array.isArray(spec.outOfScope)) {
    spec.outOfScope = [];
  }

  // technicalConstraints nested arrays
  if (spec.technicalConstraints && typeof spec.technicalConstraints === 'object') {
    const tc = spec.technicalConstraints as Record<string, unknown>;
    if (typeof tc.integrations === 'string') {
      tc.integrations = [tc.integrations];
    }
    if (typeof tc.nonFunctional === 'string') {
      tc.nonFunctional = [tc.nonFunctional];
    }
  }

  if (raw.spec) {
    raw.spec = spec;
  }

  return raw;
}

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

      // Normalize AI response before validation (fix string-instead-of-array etc.)
      if (rawParsed && typeof rawParsed === 'object') {
        rawParsed = normalizeSpecResponse(rawParsed as Record<string, unknown>);
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
      } else if (msg.type === 'spec_rejected') {
        const feedback = typeof msg.content === 'object' && msg.content !== null
          ? (msg.content as Record<string, unknown>).feedback
          : msg.content;
        lines.push(`[KULLANICI REDDETTİ — Geri bildirim: ${feedback}]`);
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
