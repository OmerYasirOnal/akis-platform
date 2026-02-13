/**
 * ClaimDecomposer — AI-powered atomic claim extraction
 *
 * M2-KI-2: Extracts atomic, verifiable claims from agent-generated content.
 * Each claim is a single factual assertion that can be independently checked
 * against evidence (knowledge base, external sources, or code analysis).
 *
 * Design references:
 * - Min et al. (2023) "FActScore" — atomic claim decomposition for factuality
 * - Wei et al. (2024) "Long-form factuality" — claim-level verification pipeline
 */

import { z } from 'zod';

// =============================================================================
// Types
// =============================================================================

export interface Claim {
  /** Unique claim identifier within the decomposition */
  id: string;
  /** The atomic factual assertion */
  text: string;
  /** Claim category */
  category: ClaimCategory;
  /** Confidence that this is a factual claim (vs. opinion/subjective) */
  factuality: number; // 0-1
  /** Whether this claim is critical (blocking if unverified) */
  critical: boolean;
  /** Source location in the original content */
  sourceSpan?: { start: number; end: number };
  /** Any cited sources from the original text */
  citations?: string[];
}

export type ClaimCategory =
  | 'technical_fact'      // "React uses a virtual DOM"
  | 'code_assertion'      // "The function returns a Promise<string>"
  | 'api_behavior'        // "GET /users returns 200 with a JSON array"
  | 'version_claim'       // "Node.js 20 supports ES modules natively"
  | 'configuration'       // "Set TRUST_PROXY=true for reverse proxies"
  | 'best_practice'       // "Always validate user input"
  | 'dependency'          // "Requires PostgreSQL 14+"
  | 'metric'              // "Reduces bundle size by 40%"
  | 'architectural'       // "Uses microservice architecture"
  | 'general';            // Catch-all

export interface DecompositionResult {
  /** All extracted claims */
  claims: Claim[];
  /** Summary statistics */
  stats: {
    totalClaims: number;
    criticalClaims: number;
    categoryCounts: Record<string, number>;
    avgFactuality: number;
  };
  /** Processing metadata */
  meta: {
    inputLength: number;
    durationMs: number;
    model?: string;
  };
}

export interface DecomposeOptions {
  /** Maximum number of claims to extract */
  maxClaims?: number;
  /** Minimum factuality score to include (0-1) */
  minFactuality?: number;
  /** Categories to focus on (empty = all) */
  focusCategories?: ClaimCategory[];
  /** Mark claims as critical if they fall in these categories */
  criticalCategories?: ClaimCategory[];
}

// =============================================================================
// Zod Schema for AI response parsing
// =============================================================================

const ClaimSchema = z.object({
  text: z.string().min(5),
  category: z.enum([
    'technical_fact', 'code_assertion', 'api_behavior',
    'version_claim', 'configuration', 'best_practice',
    'dependency', 'metric', 'architectural', 'general',
  ]),
  factuality: z.number().min(0).max(1),
  critical: z.boolean(),
  citations: z.array(z.string()).optional(),
});

const DecompositionResponseSchema = z.object({
  claims: z.array(ClaimSchema).min(0),
});

// =============================================================================
// AI Prompt
// =============================================================================

const DECOMPOSE_SYSTEM_PROMPT = `You are a factuality analysis engine. Given a piece of text (typically AI-generated documentation, test plans, or code scaffolds), your job is to extract all atomic, verifiable factual claims.

Rules:
1. Each claim must be a SINGLE factual assertion — not compound.
2. Claims must be VERIFIABLE — either against code, documentation, or external references.
3. Skip opinions, subjective statements, and filler text.
4. Classify each claim into the most specific category.
5. Rate factuality: 1.0 = clearly factual, 0.5 = somewhat verifiable, 0.0 = purely subjective.
6. Mark critical = true if the claim, if wrong, could cause real harm (wrong API behavior, wrong security config, etc.)
7. If the text contains inline citations or references, extract them.

Respond in JSON format:
{
  "claims": [
    {
      "text": "The atomic claim text",
      "category": "technical_fact",
      "factuality": 0.9,
      "critical": false,
      "citations": ["optional source reference"]
    }
  ]
}`;

// =============================================================================
// ClaimDecomposer (pure logic + AI integration point)
// =============================================================================

/**
 * AI interface required by ClaimDecomposer.
 * Matches a subset of AIService.generateWorkArtifact.
 */
export interface ClaimDecomposerAI {
  generateWorkArtifact(input: {
    task: string;
    context?: unknown;
    systemPrompt?: string;
    maxTokens?: number;
  }): Promise<{ content: string; metadata?: Record<string, unknown> }>;
}

export class ClaimDecomposer {
  constructor(private ai?: ClaimDecomposerAI) {}

  /**
   * Decompose text into atomic verifiable claims.
   * If no AI service is provided, uses rule-based extraction (heuristic).
   */
  async decompose(
    text: string,
    options: DecomposeOptions = {},
  ): Promise<DecompositionResult> {
    const start = Date.now();
    const {
      maxClaims = 100,
      minFactuality = 0.3,
      focusCategories = [],
      criticalCategories = ['api_behavior', 'configuration', 'dependency', 'code_assertion'],
    } = options;

    let rawClaims: Claim[];

    if (this.ai) {
      rawClaims = await this.aiDecompose(text, maxClaims);
    } else {
      rawClaims = this.heuristicDecompose(text);
    }

    // Post-processing
    let claims = rawClaims
      .filter(c => c.factuality >= minFactuality)
      .slice(0, maxClaims);

    // Apply focus filter
    if (focusCategories.length > 0) {
      claims = claims.filter(c => focusCategories.includes(c.category));
    }

    // Override critical flag based on categories
    claims = claims.map(c => ({
      ...c,
      critical: c.critical || criticalCategories.includes(c.category),
    }));

    // Assign IDs
    claims = claims.map((c, i) => ({
      ...c,
      id: `claim-${i + 1}`,
    }));

    // Compute stats
    const categoryCounts: Record<string, number> = {};
    for (const c of claims) {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    }

    const avgFactuality = claims.length > 0
      ? claims.reduce((sum, c) => sum + c.factuality, 0) / claims.length
      : 0;

    return {
      claims,
      stats: {
        totalClaims: claims.length,
        criticalClaims: claims.filter(c => c.critical).length,
        categoryCounts,
        avgFactuality: Math.round(avgFactuality * 100) / 100,
      },
      meta: {
        inputLength: text.length,
        durationMs: Date.now() - start,
      },
    };
  }

  /**
   * AI-powered decomposition using LLM
   */
  private async aiDecompose(text: string, maxClaims: number): Promise<Claim[]> {
    if (!this.ai) { return []; }

    const truncatedText = text.length > 8000
      ? text.substring(0, 8000) + '\n...(truncated)'
      : text;

    const result = await this.ai.generateWorkArtifact({
      task: `Extract up to ${maxClaims} atomic verifiable claims from the following text:\n\n${truncatedText}`,
      systemPrompt: DECOMPOSE_SYSTEM_PROMPT,
      maxTokens: 4096,
    });

    try {
      const parsed = this.parseJsonResponse(result.content);
      const validated = DecompositionResponseSchema.parse(parsed);

      return validated.claims.map((c, i) => ({
        id: `claim-${i + 1}`,
        text: c.text,
        category: c.category as ClaimCategory,
        factuality: c.factuality,
        critical: c.critical,
        citations: c.citations,
      }));
    } catch {
      // Fallback to heuristic if AI response is invalid
      return this.heuristicDecompose(text);
    }
  }

  /**
   * Rule-based heuristic decomposition (no AI required)
   * Extracts sentences that look like factual assertions.
   */
  heuristicDecompose(text: string): Claim[] {
    const claims: Claim[] = [];
    const sentences = this.splitIntoSentences(text);

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length < 10 || trimmed.length > 500) { continue; }

      // Skip non-factual patterns
      if (this.isNonFactual(trimmed)) { continue; }

      const category = this.categorize(trimmed);
      const factuality = this.estimateFactuality(trimmed);
      const critical = ['api_behavior', 'configuration', 'dependency', 'code_assertion']
        .includes(category);

      claims.push({
        id: '', // assigned later
        text: trimmed,
        category,
        factuality,
        critical,
        citations: this.extractCitations(trimmed),
      });
    }

    return claims;
  }

  private splitIntoSentences(text: string): string[] {
    // Remove markdown headers, code blocks, and formatting
    const cleaned = text
      .replace(/```[\s\S]*?```/g, '')
      .replace(/^#+\s+.*/gm, '')
      .replace(/\|[^\n]+\|/g, '') // tables
      .replace(/^\s*[-*]\s*/gm, ''); // list markers

    return cleaned
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 10);
  }

  private isNonFactual(sentence: string): boolean {
    const patterns = [
      /^(note|todo|fixme|hack|warning|caution)/i,
      /should\s+consider/i,
      /it\s+is\s+recommended/i,
      /^(we|you|i)\s+(can|should|might|could)/i,
      /^\s*\/\//,
      /^\s*\*/,
      /example/i,
    ];
    return patterns.some(p => p.test(sentence));
  }

  private categorize(sentence: string): ClaimCategory {
    const lower = sentence.toLowerCase();

    if (/\b(api|endpoint|route|get|post|put|delete|patch)\b.*\b(returns?|responds?|status)\b/.test(lower)) {
      return 'api_behavior';
    }
    if (/\b(function|method|class|interface|type|returns?|param|argument)\b/.test(lower) && /\b(takes?|accepts?|returns?|throws?|implements?)\b/.test(lower)) {
      return 'code_assertion';
    }
    if (/\bv?\d+\.\d+/.test(sentence) || /\b(version|release|update)\b/i.test(lower)) {
      return 'version_claim';
    }
    if (/\b(config|env|set|enable|disable|flag|option)\b/i.test(lower)) {
      return 'configuration';
    }
    if (/\b(requires?|depends?|needs?|peer)\b/i.test(lower) && /\b(on|package|library|module)\b/i.test(lower)) {
      return 'dependency';
    }
    if (/\b\d+(\.\d+)?%/.test(sentence) || /\b(reduces?|increases?|improves?|faster|slower)\b/i.test(lower)) {
      return 'metric';
    }
    if (/\b(architecture|pattern|design|layer|module|service|component)\b/i.test(lower)) {
      return 'architectural';
    }
    if (/\b(always|never|must|best practice|convention)\b/i.test(lower)) {
      return 'best_practice';
    }

    return 'technical_fact';
  }

  private estimateFactuality(sentence: string): number {
    let score = 0.6; // baseline

    // Indicators of factuality
    if (/\bv?\d+\.\d+/.test(sentence)) { score += 0.1; } // version numbers
    if (/`[^`]+`/.test(sentence)) { score += 0.1; } // inline code
    if (/\b(returns?|throws?|accepts?|requires?)\b/i.test(sentence)) { score += 0.1; }
    if (/\b\d+/.test(sentence)) { score += 0.05; } // any numbers

    // Indicators of subjectivity
    if (/\b(might|maybe|probably|could|seems?)\b/i.test(sentence)) { score -= 0.2; }
    if (/\b(good|bad|best|worst|great|terrible)\b/i.test(sentence)) { score -= 0.15; }

    return Math.max(0, Math.min(1, score));
  }

  private extractCitations(sentence: string): string[] {
    const citations: string[] = [];

    // Markdown links
    const linkMatches = sentence.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
    for (const m of linkMatches) {
      citations.push(m[2]);
    }

    // URL patterns
    const urlMatches = sentence.matchAll(/https?:\/\/[^\s)]+/g);
    for (const m of urlMatches) {
      citations.push(m[0]);
    }

    return citations;
  }

  private parseJsonResponse(content: string): unknown {
    // Try direct parse first
    try {
      return JSON.parse(content);
    } catch {
      // Try extracting JSON from markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      throw new Error('Could not parse AI response as JSON');
    }
  }
}
