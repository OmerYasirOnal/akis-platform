import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { generateGherkinFromSpec } from '../../src/pipeline/integrations/cucumberGenerator.js';
import type { StructuredSpec } from '../../src/pipeline/core/contracts/PipelineTypes.js';

// ─── Test Fixtures ────────────────────────────────

const fullSpec: StructuredSpec = {
  title: 'Todo App',
  problemStatement: 'Kullanıcıların görevlerini takip edebilecekleri bir uygulama.',
  userStories: [
    { persona: 'Kayıtlı kullanıcı', action: 'Yeni görev oluşturma', benefit: 'Günlük işlerimi takip edebilmek' },
    { persona: 'Yönetici', action: 'Kullanıcıları yönetme', benefit: 'Sistem kontrolü sağlamak' },
  ],
  acceptanceCriteria: [
    { id: 'ac-1', given: 'Giriş yapmış kullanıcı', when: 'Yeni görev butonuna tıklarsa', then: 'Görev listesinde yeni görev görünür' },
    { id: 'ac-2', given: 'Görev listesinde görev varken', when: 'Tamamla butonuna tıklarsa', then: 'Görev tamamlandı olarak işaretlenir' },
  ],
  technicalConstraints: { stack: 'React + Vite' },
  outOfScope: ['Admin paneli'],
};

const specNoStories: StructuredSpec = {
  title: 'Config Tool',
  problemStatement: 'Ayarları yönetmek için bir araç.',
  userStories: [],
  acceptanceCriteria: [
    { id: 'ac-1', given: 'Sistem hazır', when: 'Ayar değiştirildiğinde', then: 'Yeni ayar kaydedilir' },
  ],
  technicalConstraints: { stack: 'Node.js' },
  outOfScope: [],
};

const specNoCriteria: StructuredSpec = {
  title: 'Empty Features App',
  problemStatement: 'Hiçbir kabul kriteri olmayan basit proje.',
  userStories: [
    { persona: 'Kullanıcı', action: 'Giriş yapma', benefit: 'Erişim' },
  ],
  acceptanceCriteria: [],
  technicalConstraints: { stack: 'React' },
  outOfScope: [],
};

// ─── Full Spec → Feature Files ────────────────────

describe('Cucumber Generator — Full spec with user stories', () => {
  it('generates feature files from spec', () => {
    const result = generateGherkinFromSpec(fullSpec);

    assert.ok(result.features.length >= 1);
    assert.ok(result.stepDefinitions.length >= 1);

    const feature = result.features[0];
    assert.ok(feature.featureName.length > 0);
    assert.ok(feature.filePath.startsWith('features/'));
    assert.ok(feature.filePath.endsWith('.feature'));
    assert.ok(feature.content.includes('Feature:'));
    assert.ok(feature.scenarioCount >= 1);
  });

  it('includes Given/When/Then in feature content', () => {
    const result = generateGherkinFromSpec(fullSpec);
    const content = result.features[0].content;

    assert.ok(content.includes('Given'));
    assert.ok(content.includes('When'));
    assert.ok(content.includes('Then'));
  });

  it('maps acceptance criteria IDs to scenarios', () => {
    const result = generateGherkinFromSpec(fullSpec);
    const feature = result.features[0];

    assert.ok(feature.mappedCriteria.includes('ac-1'));
    assert.ok(feature.mappedCriteria.includes('ac-2'));
    assert.equal(feature.scenarioCount, 2);
  });

  it('generates step definition stubs', () => {
    const result = generateGherkinFromSpec(fullSpec);

    assert.ok(result.stepDefinitions.length >= 1);
    const stepDef = result.stepDefinitions[0];
    assert.ok(stepDef.filePath.includes('steps/'));
    assert.ok(stepDef.filePath.endsWith('.steps.ts'));
    assert.ok(stepDef.content.includes("import { Given, When, Then }"));
    assert.ok(stepDef.content.includes('Given('));
    assert.ok(stepDef.content.includes('When('));
    assert.ok(stepDef.content.includes('Then('));
  });
});

// ─── Spec with criteria but no user stories ───────

describe('Cucumber Generator — No user stories with acceptance criteria', () => {
  it('creates a general feature from acceptance criteria', () => {
    const result = generateGherkinFromSpec(specNoStories);

    assert.equal(result.features.length, 1);
    const feature = result.features[0];
    assert.ok(feature.content.includes('Feature:'));
    assert.ok(feature.content.includes('Scenario: ac-1'));
    assert.ok(feature.mappedCriteria.includes('ac-1'));
    assert.equal(feature.filePath, 'features/general-requirements.feature');
  });
});

// ─── Empty user stories and empty criteria ────────

describe('Cucumber Generator — Empty spec', () => {
  it('returns empty features when no criteria exist', () => {
    const result = generateGherkinFromSpec(specNoCriteria);

    assert.equal(result.features.length, 0);
    assert.equal(result.stepDefinitions.length, 0);
  });
});

// ─── Feature file path sanitization ──────────────

describe('Cucumber Generator — File path sanitization', () => {
  it('sanitizes feature name to create valid file paths', () => {
    const specWithSpecialChars: StructuredSpec = {
      title: 'Test',
      problemStatement: 'Test',
      userStories: [
        { persona: 'User', action: 'Özel karakterli görev (test)', benefit: 'Sonuç' },
      ],
      acceptanceCriteria: [
        { id: 'ac-1', given: 'Ready', when: 'Action', then: 'Result' },
      ],
      technicalConstraints: { stack: 'React' },
      outOfScope: [],
    };

    const result = generateGherkinFromSpec(specWithSpecialChars);
    assert.ok(result.features.length >= 1);

    const filePath = result.features[0].filePath;
    // Should not contain non-alphanumeric characters other than hyphens, slashes, and dots
    assert.ok(!filePath.includes('('));
    assert.ok(!filePath.includes(')'));
    assert.ok(!filePath.includes(' '));
  });
});
