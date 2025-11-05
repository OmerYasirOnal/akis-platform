import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';
import { createHash } from 'crypto';

/**
 * ScribeAgent - Documents new features by updating technical documentation
 * Phase 6.A: Deterministic doc-delta playbook (no external network)
 * Extends BaseAgent; accepts injected tools (MCP adapters, AIService) via constructor
 */
export class ScribeAgent extends BaseAgent {
  readonly type = 'scribe';
  private deps?: AgentDependencies;

  constructor(deps?: AgentDependencies) {
    super();
    this.deps = deps;
    // ScribeAgent does not require planning or reflection (simple agent)
    this.playbook.requiresPlanning = false;
    this.playbook.requiresReflection = false;
  }

  /**
   * Execute deterministic doc-delta transformation
   * Input: { doc: string }
   * Output: { summary: string, outline: Array<{level: number, title: string}>, suggestions: string[] }
   */
  async execute(context: unknown): Promise<unknown> {
    // Validate input
    if (!context || typeof context !== 'object' || !('doc' in context)) {
      throw new Error('ScribeAgent requires payload with "doc" field');
    }

    const payload = context as { doc: string };
    const doc = typeof payload.doc === 'string' ? payload.doc : String(payload.doc);

    // Step 1: Tokenize and extract headings (deterministic)
    const headings = this.extractHeadings(doc);
    
    // Step 2: Generate summary (deterministic - first 200 chars + word count)
    const summary = this.generateSummary(doc);

    // Step 3: Generate outline from headings (stable sort by position)
    const outline = headings.map((h, idx) => ({
      level: h.level,
      title: h.title,
      position: idx,
    }));

    // Step 4: Generate suggestions (deterministic based on doc structure)
    const suggestions = this.generateSuggestions(doc, headings);

    // Generate idempotent hash (job id + step count)
    const stepCount = outline.length + suggestions.length;
    const hash = createHash('sha256')
      .update(`${this.type}-${stepCount}-${doc.substring(0, 100)}`)
      .digest('hex')
      .substring(0, 16);

    return {
      ok: true,
      agent: 'scribe',
      summary,
      outline,
      suggestions,
      hash, // Idempotent hash for audit
      metadata: {
        wordCount: doc.split(/\s+/).length,
        headingCount: headings.length,
        docLength: doc.length,
      },
    };
  }

  /**
   * Extract headings from markdown/doc text (deterministic)
   */
  private extractHeadings(doc: string): Array<{ level: number; title: string; position: number }> {
    const headings: Array<{ level: number; title: string; position: number }> = [];
    const lines = doc.split('\n');
    let position = 0;

    for (const line of lines) {
      // Markdown headings: # Title, ## Subtitle, etc.
      const markdownMatch = line.match(/^(#{1,6})\s+(.+)$/);
      if (markdownMatch) {
        headings.push({
          level: markdownMatch[1].length,
          title: markdownMatch[2].trim(),
          position: position++,
        });
        continue;
      }

      // Alternative heading patterns (all caps line, underlined, etc.)
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 100) {
        // Simple heuristic: all caps or title case might be a heading
        const isLikelyHeading = /^[A-Z][A-Za-z\s]+$/.test(trimmed) && trimmed.split(' ').length <= 10;
        if (isLikelyHeading && headings.length === 0) {
          // Only treat as heading if no headings found yet (avoid false positives)
          headings.push({
            level: 1,
            title: trimmed,
            position: position++,
          });
        }
      }
    }

    return headings;
  }

  /**
   * Generate summary (deterministic)
   */
  private generateSummary(doc: string): string {
    const sentences = doc.split(/[.!?]+/).filter((s) => s.trim().length > 10);
    const firstSentence = sentences[0]?.trim() || doc.substring(0, 200).trim();
    const wordCount = doc.split(/\s+/).length;
    
    return `${firstSentence.substring(0, 200)}${firstSentence.length > 200 ? '...' : ''} (${wordCount} words)`;
  }

  /**
   * Generate suggestions (deterministic based on doc structure)
   */
  private generateSuggestions(doc: string, headings: Array<{ level: number; title: string }>): string[] {
    const suggestions: string[] = [];

    // Suggestion 1: Check for headings
    if (headings.length === 0) {
      suggestions.push('Consider adding section headings to improve structure');
    } else if (headings.length < 3) {
      suggestions.push('Document may benefit from more structured sections');
    }

    // Suggestion 2: Check length
    const wordCount = doc.split(/\s+/).length;
    if (wordCount < 50) {
      suggestions.push('Documentation appears brief; consider adding more detail');
    } else if (wordCount > 2000) {
      suggestions.push('Consider splitting into multiple documentation pages');
    }

    // Suggestion 3: Check for code examples
    if (!doc.includes('```') && !doc.includes('`')) {
      suggestions.push('Consider adding code examples or snippets');
    }

    // Suggestion 4: Check for links
    if (!doc.includes('http://') && !doc.includes('https://') && !doc.includes('[')) {
      suggestions.push('Consider adding links to related documentation or resources');
    }

    return suggestions;
  }
}

