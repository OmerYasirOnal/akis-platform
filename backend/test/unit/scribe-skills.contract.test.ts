import assert from 'node:assert';
import { test } from 'node:test';
import {
  runScribeSkill,
  DocPackFromRepoOutputSchema,
  ReleaseNotesFromPRsOutputSchema,
  ChecklistFromRunbookOutputSchema,
} from '../../src/core/contracts/ScribeSkillContracts.js';

test('DocPackFromRepo returns deterministic contract-compliant output', () => {
  const input = {
    repository: { owner: 'akis', repo: 'platform', branch: 'main' },
    objective: 'Generate docpack',
    files: [
      { path: 'src/z.ts', summary: 'z file', constraints: ['no hallucination'] },
      { path: 'src/a.ts', summary: 'a file', constraints: ['no hallucination', 'stable headings'] },
    ],
  };
  const outputA = runScribeSkill('DocPackFromRepo', input);
  const outputB = runScribeSkill('DocPackFromRepo', input);

  DocPackFromRepoOutputSchema.parse(outputA);
  assert.deepStrictEqual(outputA, outputB);
  assert.deepStrictEqual(outputA.sections.files.map((file) => file.path), ['src/a.ts', 'src/z.ts']);
  assert.deepStrictEqual(outputA.sections.constraints, ['no hallucination', 'stable headings']);
});

test('ReleaseNotesFromPRs has stable ordering and required sections', () => {
  const output = runScribeSkill('ReleaseNotesFromPRs', {
    releaseVersion: 'v0.5.0',
    pullRequests: [
      { number: 22, title: 'Fix auth', labels: ['bug'], mergedAt: '2026-02-10T10:00:00Z' },
      { number: 7, title: 'Add docpack skill', labels: ['feature'], mergedAt: '2026-02-09T10:00:00Z' },
    ],
    breakingChanges: [],
  });

  ReleaseNotesFromPRsOutputSchema.parse(output);
  assert.strictEqual(output.sections.releaseVersion, 'v0.5.0');
  assert.deepStrictEqual(output.sections.changes.map((change) => change.number), [7, 22]);
  assert.ok(output.markdown.includes('## Highlights'));
  assert.ok(output.markdown.includes('## Changes'));
});

test('ChecklistFromRunbook includes mandatory fields and sequential IDs', () => {
  const output = runScribeSkill('ChecklistFromRunbook', {
    runbookTitle: 'Staging Golden Path',
    steps: [
      { title: 'Check /ready', action: 'curl /ready', verification: 'ready=true', mandatory: true },
      { title: 'Run smoke', action: './scripts/staging_smoke.sh', verification: 'all pass', mandatory: false },
    ],
  });

  ChecklistFromRunbookOutputSchema.parse(output);
  assert.deepStrictEqual(output.sections.checklist.map((item) => item.id), ['CHK-01', 'CHK-02']);
  assert.strictEqual(output.sections.mandatoryCount, 1);
});

test('invalid payloads fail mandatory schema checks', () => {
  assert.throws(() => runScribeSkill('DocPackFromRepo', { repository: { owner: 'a', repo: 'b', branch: 'main' }, files: [] }));
  assert.throws(() => runScribeSkill('ReleaseNotesFromPRs', { releaseVersion: 'v1', pullRequests: [] }));
  assert.throws(() => runScribeSkill('ChecklistFromRunbook', { runbookTitle: 'Ops', steps: [] }));
});
