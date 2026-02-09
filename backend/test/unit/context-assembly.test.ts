/**
 * Contract tests for ContextAssemblyService
 * Re-creates pure helpers and tests formatForPrompt logic
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── Re-create types and helpers from ContextAssemblyService.ts ──

interface ContextLayer {
  role: 'system' | 'instruction' | 'data';
  label: string;
  content: string;
  provenance?: string;
}

interface AssembledContext {
  layers: ContextLayer[];
  totalTokens: number;
  retrievedKnowledge: unknown[];
}

const PLATFORM_POLICY = `You are an AI agent in the AKIS platform.
- Always provide accurate, evidence-based responses
- Never fabricate information or make unsupported claims
- Cite sources when available using provenance references
- If you lack sufficient information, acknowledge it clearly
- Follow the specific agent contract and guidelines provided`;

const AGENT_IDENTITY_PACKS: Record<string, string> = {
  developer: `You are the Developer Agent, specialized in code generation and software development tasks.
Your outputs must follow the TASK/LOCATION/RULES format suitable for implementation.
You can propose Knowledge Base updates but cannot directly modify approved content.`,
  scribe: `You are the Scribe Agent, specialized in documentation and technical writing.
Your outputs must include provenance references for all facts and claims.
If evidence is insufficient, fail safely with a structured "missing input" outcome.`,
  default: `You are an AKIS Agent, ready to assist with development tasks.
Follow your specific contract guidelines and maintain output quality.`,
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function formatForPrompt(assembledContext: AssembledContext): string {
  const systemLayers = assembledContext.layers.filter(l => l.role === 'system');
  const instructionLayers = assembledContext.layers.filter(l => l.role === 'instruction');
  const dataLayers = assembledContext.layers.filter(l => l.role === 'data');

  const parts: string[] = [];

  if (systemLayers.length > 0) {
    parts.push('## SYSTEM INSTRUCTIONS\n' + systemLayers.map(l => l.content).join('\n\n'));
  }

  if (instructionLayers.length > 0) {
    parts.push('## AGENT GUIDELINES\n' + instructionLayers.map(l => l.content).join('\n\n'));
  }

  if (dataLayers.length > 0) {
    parts.push('## CONTEXT DATA\n' + dataLayers.map(l => `### ${l.label}\n${l.content}`).join('\n\n'));
  }

  return parts.join('\n\n---\n\n');
}

function getIdentityPack(agentType: string): string {
  return AGENT_IDENTITY_PACKS[agentType] || AGENT_IDENTITY_PACKS.default;
}

// ─── estimateTokens ──────────────────────────────────────────────

describe('estimateTokens (ContextAssembly)', () => {
  it('estimates ~1 token per 4 chars', () => {
    assert.equal(estimateTokens('abcd'), 1);
  });

  it('rounds up for partial tokens', () => {
    assert.equal(estimateTokens('ab'), 1);
    assert.equal(estimateTokens('abcde'), 2);
  });

  it('returns 0 for empty string', () => {
    assert.equal(estimateTokens(''), 0);
  });

  it('handles long text', () => {
    const text = 'x'.repeat(1000);
    assert.equal(estimateTokens(text), 250);
  });
});

// ─── getIdentityPack ──────────────────────────────────────────────

describe('getIdentityPack', () => {
  it('returns developer pack for developer agent', () => {
    const pack = getIdentityPack('developer');
    assert.ok(pack.includes('Developer Agent'));
    assert.ok(pack.includes('TASK/LOCATION/RULES'));
  });

  it('returns scribe pack for scribe agent', () => {
    const pack = getIdentityPack('scribe');
    assert.ok(pack.includes('Scribe Agent'));
    assert.ok(pack.includes('provenance references'));
  });

  it('returns default pack for unknown agent', () => {
    const pack = getIdentityPack('unknown-agent');
    assert.ok(pack.includes('AKIS Agent'));
  });
});

// ─── PLATFORM_POLICY ──────────────────────────────────────────────

describe('PLATFORM_POLICY', () => {
  it('contains evidence-based instruction', () => {
    assert.ok(PLATFORM_POLICY.includes('evidence-based'));
  });

  it('contains no-fabrication instruction', () => {
    assert.ok(PLATFORM_POLICY.includes('Never fabricate'));
  });

  it('contains source citation instruction', () => {
    assert.ok(PLATFORM_POLICY.includes('Cite sources'));
  });
});

// ─── formatForPrompt ──────────────────────────────────────────────

describe('formatForPrompt', () => {
  it('formats system-only context', () => {
    const ctx: AssembledContext = {
      layers: [{ role: 'system', label: 'Policy', content: 'Do the right thing' }],
      totalTokens: 5,
      retrievedKnowledge: [],
    };
    const result = formatForPrompt(ctx);
    assert.ok(result.includes('## SYSTEM INSTRUCTIONS'));
    assert.ok(result.includes('Do the right thing'));
    assert.ok(!result.includes('## AGENT GUIDELINES'));
    assert.ok(!result.includes('## CONTEXT DATA'));
  });

  it('formats instruction-only context', () => {
    const ctx: AssembledContext = {
      layers: [{ role: 'instruction', label: 'Identity', content: 'You are a helper' }],
      totalTokens: 4,
      retrievedKnowledge: [],
    };
    const result = formatForPrompt(ctx);
    assert.ok(result.includes('## AGENT GUIDELINES'));
    assert.ok(result.includes('You are a helper'));
    assert.ok(!result.includes('## SYSTEM INSTRUCTIONS'));
  });

  it('formats data-only context with label as heading', () => {
    const ctx: AssembledContext = {
      layers: [{ role: 'data', label: 'Job Input', content: 'Write docs for auth' }],
      totalTokens: 5,
      retrievedKnowledge: [],
    };
    const result = formatForPrompt(ctx);
    assert.ok(result.includes('## CONTEXT DATA'));
    assert.ok(result.includes('### Job Input'));
    assert.ok(result.includes('Write docs for auth'));
  });

  it('joins sections with --- separator', () => {
    const ctx: AssembledContext = {
      layers: [
        { role: 'system', label: 'Policy', content: 'Policy text' },
        { role: 'instruction', label: 'Identity', content: 'Identity text' },
        { role: 'data', label: 'Input', content: 'Input text' },
      ],
      totalTokens: 10,
      retrievedKnowledge: [],
    };
    const result = formatForPrompt(ctx);
    const parts = result.split('\n\n---\n\n');
    assert.equal(parts.length, 3);
    assert.ok(parts[0].startsWith('## SYSTEM INSTRUCTIONS'));
    assert.ok(parts[1].startsWith('## AGENT GUIDELINES'));
    assert.ok(parts[2].startsWith('## CONTEXT DATA'));
  });

  it('handles multiple data layers', () => {
    const ctx: AssembledContext = {
      layers: [
        { role: 'data', label: 'Knowledge', content: 'KB content' },
        { role: 'data', label: 'Job Input', content: 'Job content' },
      ],
      totalTokens: 6,
      retrievedKnowledge: [],
    };
    const result = formatForPrompt(ctx);
    assert.ok(result.includes('### Knowledge'));
    assert.ok(result.includes('### Job Input'));
  });

  it('handles empty layers', () => {
    const ctx: AssembledContext = {
      layers: [],
      totalTokens: 0,
      retrievedKnowledge: [],
    };
    const result = formatForPrompt(ctx);
    assert.equal(result, '');
  });

  it('groups layers by role regardless of input order', () => {
    const ctx: AssembledContext = {
      layers: [
        { role: 'data', label: 'Input', content: 'input' },
        { role: 'system', label: 'Policy', content: 'policy' },
        { role: 'instruction', label: 'Identity', content: 'identity' },
      ],
      totalTokens: 5,
      retrievedKnowledge: [],
    };
    const result = formatForPrompt(ctx);
    const sysIdx = result.indexOf('## SYSTEM INSTRUCTIONS');
    const guideIdx = result.indexOf('## AGENT GUIDELINES');
    const dataIdx = result.indexOf('## CONTEXT DATA');
    assert.ok(sysIdx < guideIdx, 'system before guidelines');
    assert.ok(guideIdx < dataIdx, 'guidelines before data');
  });
});

// ─── Layer assembly contract ──────────────────────────────────────

describe('layer assembly contract (without retrieval)', () => {
  function assembleLayers(
    agentType: string,
    jobInput?: string,
    conversationHistory?: Array<{ role: string; content: string }>,
  ): { layers: ContextLayer[]; totalTokens: number } {
    const layers: ContextLayer[] = [];
    let totalTokens = 0;

    layers.push({ role: 'system', label: 'Platform Policy', content: PLATFORM_POLICY });
    totalTokens += estimateTokens(PLATFORM_POLICY);

    const identityPack = getIdentityPack(agentType);
    layers.push({ role: 'instruction', label: 'Agent Identity', content: identityPack });
    totalTokens += estimateTokens(identityPack);

    if (jobInput) {
      layers.push({ role: 'data', label: 'Job Input', content: jobInput });
      totalTokens += estimateTokens(jobInput);
    }

    if (conversationHistory && conversationHistory.length > 0) {
      const historyContent = conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n\n');
      layers.push({ role: 'data', label: 'Conversation History', content: historyContent });
      totalTokens += estimateTokens(historyContent);
    }

    return { layers, totalTokens };
  }

  it('always includes platform policy as first layer', () => {
    const { layers } = assembleLayers('scribe');
    assert.equal(layers[0].role, 'system');
    assert.equal(layers[0].label, 'Platform Policy');
  });

  it('always includes agent identity as second layer', () => {
    const { layers } = assembleLayers('scribe');
    assert.equal(layers[1].role, 'instruction');
    assert.equal(layers[1].label, 'Agent Identity');
  });

  it('adds job input when provided', () => {
    const { layers } = assembleLayers('scribe', 'Write docs for login');
    const jobLayer = layers.find(l => l.label === 'Job Input');
    assert.ok(jobLayer);
    assert.equal(jobLayer.content, 'Write docs for login');
  });

  it('omits job input when not provided', () => {
    const { layers } = assembleLayers('scribe');
    assert.equal(layers.length, 2);
  });

  it('adds conversation history when provided', () => {
    const { layers } = assembleLayers('scribe', undefined, [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]);
    const historyLayer = layers.find(l => l.label === 'Conversation History');
    assert.ok(historyLayer);
    assert.ok(historyLayer.content.includes('user: Hello'));
    assert.ok(historyLayer.content.includes('assistant: Hi there'));
  });

  it('accumulates token counts correctly', () => {
    const input = 'Write docs';
    const { totalTokens } = assembleLayers('scribe', input);
    const expected =
      estimateTokens(PLATFORM_POLICY) +
      estimateTokens(getIdentityPack('scribe')) +
      estimateTokens(input);
    assert.equal(totalTokens, expected);
  });
});
