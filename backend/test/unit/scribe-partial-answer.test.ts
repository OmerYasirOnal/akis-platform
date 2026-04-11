import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { ScribeAgent, type ScribeAIDeps } from '../../src/pipeline/agents/scribe/ScribeAgent.js';

// ─── Test Fixtures ────────────────────────────────

const clarificationJson = JSON.stringify({
  ready: false,
  questions: [
    { id: 'q1', question: 'Veritabanı tercihiniz var mı?', reason: 'Stack seçimi', suggestions: ['PostgreSQL', 'MongoDB'] },
    { id: 'q2', question: 'Hedef platform nedir?', reason: 'UI kararı', suggestions: ['Web', 'Mobile'] },
    { id: 'q3', question: 'Auth yöntemi?', reason: 'Güvenlik', suggestions: ['Google OAuth', 'Email'] },
  ],
});

const readyJson = JSON.stringify({ ready: true });

const validSpecJson = JSON.stringify({
  spec: {
    title: 'Test App',
    problemStatement: 'Kullanıcıların test yapabilecekleri basit bir uygulama.',
    userStories: [{ persona: 'Kullanıcı', action: 'Test yapma', benefit: 'Doğrulama' }],
    acceptanceCriteria: [{ id: 'ac-1', given: 'Hazır', when: 'Test çalışınca', then: 'Sonuç görünür' }],
    technicalConstraints: { stack: 'React + Vite' },
    outOfScope: [],
  },
  rawMarkdown: '# Test App',
  confidence: 0.9,
  clarificationsAsked: 0,
});

// ─── Mock AI ──────────────────────────────────────

function createMockAI(responses: string[]): ScribeAIDeps {
  let callIndex = 0;
  return {
    async generateText(_system: string, _user: string): Promise<string> {
      if (callIndex >= responses.length) throw new Error('No more mock responses');
      return responses[callIndex++];
    },
  };
}

// ─── Initial State ────────────────────────────────

describe('Scribe — Partial answer: initial state', () => {
  it('has empty pendingQuestionIds and answeredQuestionIds', () => {
    const ai = createMockAI([]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({ idea: 'Bir web uygulaması istiyorum' });

    assert.deepEqual(state.pendingQuestionIds, []);
    assert.deepEqual(state.answeredQuestionIds, []);
  });
});

// ─── Clarification populates pendingQuestionIds ───

describe('Scribe — Partial answer: clarification populates pending IDs', () => {
  it('sets pendingQuestionIds after clarification', async () => {
    const ai = createMockAI([clarificationJson, readyJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({ idea: 'Bir uygulama istiyorum, detay yok' });

    const result = await agent.analyzIdea(state);
    assert.equal(result.type, 'clarification');
    assert.deepEqual(state.pendingQuestionIds, ['q1', 'q2', 'q3']);
    assert.deepEqual(state.answeredQuestionIds, []);
  });
});

// ─── Partial answer mentioning q1 ─────────────────

describe('Scribe — Partial answer: mentioning specific question IDs', () => {
  it('moves mentioned q1 to answered, keeps q2/q3 pending', async () => {
    const ai = createMockAI([clarificationJson, readyJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({ idea: 'Bir uygulama istiyorum' });

    await agent.analyzIdea(state);
    assert.deepEqual(state.pendingQuestionIds, ['q1', 'q2', 'q3']);

    agent.processUserAnswer(state, 'q1: PostgreSQL istiyorum');

    assert.ok(state.answeredQuestionIds.includes('q1'));
    assert.ok(!state.pendingQuestionIds.includes('q1'));
    assert.ok(state.pendingQuestionIds.includes('q2'));
    assert.ok(state.pendingQuestionIds.includes('q3'));
  });

  it('moves multiple mentioned IDs to answered', async () => {
    const ai = createMockAI([clarificationJson, readyJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({ idea: 'Bir uygulama istiyorum' });

    await agent.analyzIdea(state);
    agent.processUserAnswer(state, 'q1 PostgreSQL, q3 Google OAuth');

    assert.ok(state.answeredQuestionIds.includes('q1'));
    assert.ok(state.answeredQuestionIds.includes('q3'));
    assert.ok(!state.pendingQuestionIds.includes('q1'));
    assert.ok(!state.pendingQuestionIds.includes('q3'));
    assert.ok(state.pendingQuestionIds.includes('q2'));
  });
});

// ─── Delegation phrase → all pending answered ─────

describe('Scribe — Partial answer: delegation phrases', () => {
  it('marks all pending as answered on "hepsini sen belirle"', async () => {
    const ai = createMockAI([clarificationJson, readyJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({ idea: 'Bir uygulama istiyorum' });

    await agent.analyzIdea(state);
    assert.equal(state.pendingQuestionIds.length, 3);

    agent.processUserAnswer(state, 'hepsini sen belirle');

    assert.deepEqual(state.pendingQuestionIds, []);
    assert.equal(state.answeredQuestionIds.length, 3);
    assert.ok(state.answeredQuestionIds.includes('q1'));
    assert.ok(state.answeredQuestionIds.includes('q2'));
    assert.ok(state.answeredQuestionIds.includes('q3'));
  });

  it('marks all pending as answered on "sana bırakıyorum"', async () => {
    const ai = createMockAI([clarificationJson, readyJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({ idea: 'Bir uygulama istiyorum' });

    await agent.analyzIdea(state);
    agent.processUserAnswer(state, 'sana bırakıyorum');

    assert.deepEqual(state.pendingQuestionIds, []);
    assert.equal(state.answeredQuestionIds.length, 3);
  });
});

// ─── Default fallback → all pending answered ──────

describe('Scribe — Partial answer: default fallback', () => {
  it('marks all pending as answered when no question IDs mentioned', async () => {
    const ai = createMockAI([clarificationJson, readyJson, validSpecJson]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({ idea: 'Bir uygulama istiyorum' });

    await agent.analyzIdea(state);
    assert.equal(state.pendingQuestionIds.length, 3);

    // Generic answer with no q-IDs and no delegation phrase
    agent.processUserAnswer(state, 'Web platformunda PostgreSQL kullanmak istiyorum');

    assert.deepEqual(state.pendingQuestionIds, []);
    assert.equal(state.answeredQuestionIds.length, 3);
  });
});

// ─── No pending questions → processUserAnswer is a no-op ──

describe('Scribe — Partial answer: no pending questions', () => {
  it('does not crash when processUserAnswer is called with no pending questions', () => {
    const ai = createMockAI([]);
    const agent = new ScribeAgent(ai);
    const state = agent.createInitialState({ idea: 'Bir uygulama istiyorum' });

    // No clarification has happened, so pendingQuestionIds is empty
    agent.processUserAnswer(state, 'Bir cevap');

    assert.deepEqual(state.pendingQuestionIds, []);
    assert.deepEqual(state.answeredQuestionIds, []);
  });
});
