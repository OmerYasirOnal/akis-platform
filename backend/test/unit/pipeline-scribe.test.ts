import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ScribeAgent, type ScribeAIDeps } from '../../src/pipeline/agents/scribe/ScribeAgent.js';
import { validateScribeInput } from '../../src/pipeline/agents/scribe/SpecContract.js';

// ─── Test Fixtures ────────────────────────────────

const validSpecJson = JSON.stringify({
  spec: {
    title: 'Todo App with Google Auth',
    problemStatement:
      'Kullanıcıların günlük görevlerini takip edebilecekleri, Google ile giriş yapabilecekleri basit bir uygulama.',
    userStories: [
      {
        persona: 'Kayıtlı kullanıcı',
        action: 'Yeni görev oluşturma',
        benefit: 'Günlük yapılacak işlerimi takip edebilmek',
      },
      {
        persona: 'Kayıtlı kullanıcı',
        action: 'Görevleri tamamlandı olarak işaretleme',
        benefit: 'İlerlememizi görmek',
      },
    ],
    acceptanceCriteria: [
      {
        id: 'ac-1',
        given: 'Giriş yapmış kullanıcı dashboard sayfasında',
        when: 'Yeni görev butonuna tıklayıp formu doldurunca',
        then: 'Görev listesinde yeni görev görünür',
      },
      {
        id: 'ac-2',
        given: 'Görev listesinde görev varken',
        when: 'Tamamla butonuna tıklayınca',
        then: 'Görev tamamlandı olarak işaretlenir',
      },
    ],
    technicalConstraints: {
      stack: 'React + Vite + TypeScript',
      integrations: ['Google OAuth'],
      nonFunctional: ['Mobile responsive'],
    },
    outOfScope: ['Admin paneli', 'Takım çalışması', 'Bildirimler'],
  },
  rawMarkdown:
    '# Todo App with Google Auth\n\n## Problem\nKullanıcıların günlük görevlerini takip edebilecekleri basit bir uygulama.\n\n## User Stories\n- Kayıtlı kullanıcı olarak yeni görev oluşturmak istiyorum.\n- Kayıtlı kullanıcı olarak görevleri tamamlamak istiyorum.',
  confidence: 0.9,
  clarificationsAsked: 0,
});

const clarificationJson = JSON.stringify({
  ready: false,
  questions: [
    {
      id: 'q1',
      question: 'Veritabanı tercihiniz var mı?',
      reason: 'Teknoloji stack seçimi için önemli',
      suggestions: ['PostgreSQL', 'MongoDB', 'Supabase'],
    },
    {
      id: 'q2',
      question: 'Hedef platformunuz ne?',
      reason: 'UI framework seçimini etkiler',
      suggestions: ['Web', 'Mobile', 'Her ikisi'],
    },
  ],
});

const readyJson = JSON.stringify({ ready: true });

// ─── Mock AI ──────────────────────────────────────

function createMockAI(responses: string[]): ScribeAIDeps {
  let callIndex = 0;
  return {
    async generateText(_system: string, _user: string): Promise<string> {
      if (callIndex >= responses.length) {
        throw new Error('No more mock responses');
      }
      return responses[callIndex++];
    },
  };
}

function createFailingAI(failCount: number, thenRespond: string): ScribeAIDeps {
  let failures = 0;
  return {
    async generateText(_system: string, _user: string): Promise<string> {
      if (failures < failCount) {
        failures++;
        throw new Error('AI provider error');
      }
      return thenRespond;
    },
  };
}

// ─── SpecContract ─────────────────────────────────

describe('Scribe — SpecContract', () => {
  it('validates valid input', () => {
    const input = validateScribeInput({
      idea: 'React ile bir todo uygulaması istiyorum, Google login olsun',
    });
    assert.equal(input.idea, 'React ile bir todo uygulaması istiyorum, Google login olsun');
  });

  it('rejects short input', () => {
    assert.throws(() => validateScribeInput({ idea: 'app' }));
  });

  it('rejects empty input', () => {
    assert.throws(() => validateScribeInput({ idea: '' }));
  });
});

// ─── Clear Idea → Direct Spec ─────────────────────

describe('Scribe — Clear idea skips clarification', () => {
  it('generates spec directly when AI says ready', async () => {
    const ai = createMockAI([readyJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({
      idea: 'React ile todo app istiyorum, Google login olsun, Supabase veritabanı',
    });

    const result = await agent.analyzIdea(state);
    assert.equal(result.type, 'spec');
    if (result.type === 'spec') {
      assert.equal(result.data.spec.title, 'Todo App with Google Auth');
      assert.ok(result.data.spec.userStories.length >= 1);
      assert.ok(result.data.spec.acceptanceCriteria.length >= 1);
      assert.ok(result.data.confidence >= 0 && result.data.confidence <= 1);
    }
  });
});

// ─── Vague Idea → Clarification → Spec ────────────

describe('Scribe — Vague idea triggers clarification', () => {
  it('asks questions then generates spec after user answers', async () => {
    const ai = createMockAI([clarificationJson, readyJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({
      idea: 'Bir uygulama istiyorum, kullanıcılar bir şeyler yapabilsin',
    });

    // First call: should return clarification questions
    const result1 = await agent.analyzIdea(state);
    assert.equal(result1.type, 'clarification');
    if (result1.type === 'clarification') {
      assert.ok(result1.data.questions.length >= 1);
      assert.ok(result1.data.questions.length <= 4);
      assert.equal(state.clarificationRound, 1);
    }

    // User answers
    agent.processUserAnswer(state, 'PostgreSQL istiyorum, web platformu olsun');

    // Second call: AI says ready → generates spec
    const result2 = await agent.continueAfterAnswer(state);
    assert.equal(result2.type, 'spec');
    if (result2.type === 'spec') {
      assert.ok(result2.data.spec.title.length > 0);
    }
  });
});

// ─── Max Rounds Force Spec ────────────────────────

describe('Scribe — Forces spec after 3 rounds', () => {
  it('generates spec when max rounds reached', async () => {
    const ai = createMockAI([
      clarificationJson, // round 1
      clarificationJson, // round 2
      clarificationJson, // round 3 → forced spec
      validSpecJson,
    ]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({
      idea: 'Bir uygulama istiyorum',
    });

    // Round 1
    const r1 = await agent.analyzIdea(state);
    assert.equal(r1.type, 'clarification');
    agent.processUserAnswer(state, 'Cevap 1');

    // Round 2
    const r2 = await agent.continueAfterAnswer(state);
    assert.equal(r2.type, 'clarification');
    agent.processUserAnswer(state, 'Cevap 2');

    // Round 3
    const r3 = await agent.continueAfterAnswer(state);
    assert.equal(r3.type, 'clarification');
    agent.processUserAnswer(state, 'Cevap 3');

    // Round 4 attempt: should force spec generation (round >= 3)
    const r4 = await agent.continueAfterAnswer(state);
    assert.equal(r4.type, 'spec');
  });
});

// ─── AI Error → Retry ─────────────────────────────

describe('Scribe — AI error handling', () => {
  it('returns error when clarification AI fails', async () => {
    const ai = createFailingAI(1, readyJson);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({
      idea: 'React ile bir todo uygulaması istiyorum',
    });

    const result = await agent.analyzIdea(state);
    assert.equal(result.type, 'error');
    if (result.type === 'error') {
      assert.equal(result.error.code, 'AI_PROVIDER_ERROR');
      assert.equal(result.error.retryable, true);
    }
  });

  it('retries spec generation on AI failure', async () => {
    // First call: ready (clarification phase)
    // Second call: fails (first spec attempt)
    // Third call: valid spec (retry succeeds)
    let callCount = 0;
    const ai: ScribeAIDeps = {
      async generateText() {
        callCount++;
        if (callCount === 1) return readyJson;
        if (callCount === 2) throw new Error('Transient failure');
        return validSpecJson;
      },
    };

    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({
      idea: 'React ile bir todo uygulaması istiyorum, Google login olsun',
    });

    const result = await agent.analyzIdea(state);
    assert.equal(result.type, 'spec');
  });

  it('returns error after all spec retries exhausted', async () => {
    // Override to test: always return ready, then invalid JSON for spec
    let phase = 'clarify';
    const ai2: ScribeAIDeps = {
      async generateText() {
        if (phase === 'clarify') {
          phase = 'spec';
          return readyJson;
        }
        return 'not valid json at all {{{';
      },
    };

    const agent = new ScribeAgent(ai2);
    const state = agent.createInitialState({
      idea: 'React ile bir todo uygulaması istiyorum',
    });

    const result = await agent.analyzIdea(state);
    assert.equal(result.type, 'error');
    if (result.type === 'error') {
      assert.ok(
        result.error.code === 'AI_INVALID_RESPONSE' ||
          result.error.code === 'SCRIBE_SPEC_VALIDATION_FAILED'
      );
    }
  });
});

// ─── Spec Regeneration ────────────────────────────

describe('Scribe — Spec regeneration with feedback', () => {
  it('regenerates spec with feedback', async () => {
    const ai = createMockAI([readyJson, validSpecJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({
      idea: 'React ile todo app istiyorum',
    });

    // Generate initial spec
    const result1 = await agent.analyzIdea(state);
    assert.equal(result1.type, 'spec');

    // Regenerate with feedback
    const result2 = await agent.regenerateSpec(state, 'Auth kısmını GitHub ile yapalım');
    assert.equal(result2.type, 'spec');

    // Verify feedback was added to conversation
    const rejectionMsg = state.conversation.find((m) => m.type === 'spec_rejected');
    assert.ok(rejectionMsg);
    if (rejectionMsg && rejectionMsg.type === 'spec_rejected') {
      assert.equal(rejectionMsg.content.feedback, 'Auth kısmını GitHub ile yapalım');
    }
  });
});

// ─── Conversation State ───────────────────────────

describe('Scribe — Conversation state tracking', () => {
  it('tracks conversation history correctly', async () => {
    const ai = createMockAI([clarificationJson, readyJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({
      idea: 'Bir web uygulaması istiyorum',
    });

    // Verify initial state
    assert.equal(state.conversation.length, 1);
    assert.equal(state.conversation[0].type, 'user_idea');
    assert.equal(state.clarificationRound, 0);
    assert.equal(state.phase, 'clarifying');

    // Clarification
    await agent.analyzIdea(state);
    assert.equal(state.conversation.length, 2);
    assert.equal(state.conversation[1].type, 'clarification');
    assert.equal(state.clarificationRound, 1);

    // User answer
    agent.processUserAnswer(state, 'React istiyorum');
    assert.equal(state.conversation.length, 3);
    assert.equal(state.conversation[2].type, 'user_answer');

    // Spec generation
    const result = await agent.continueAfterAnswer(state);
    assert.equal(result.type, 'spec');
    assert.equal(state.phase, 'done');
    assert.ok(state.conversation.length >= 4);
  });
});

// ─── JSON Extraction ──────────────────────────────

describe('Scribe — JSON extraction from AI responses', () => {
  it('handles fenced code block responses', async () => {
    const wrappedJson = '```json\n' + readyJson + '\n```';
    const ai = createMockAI([wrappedJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({
      idea: 'React ile bir todo uygulaması istiyorum, Google login olsun',
    });

    const result = await agent.analyzIdea(state);
    assert.equal(result.type, 'spec');
  });

  it('handles response with surrounding text', async () => {
    const withText = 'Here is my analysis:\n' + readyJson + '\nHope this helps!';
    const ai = createMockAI([withText, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({
      idea: 'React ile bir todo uygulaması istiyorum, Google login olsun',
    });

    const result = await agent.analyzIdea(state);
    assert.equal(result.type, 'spec');
  });
});
