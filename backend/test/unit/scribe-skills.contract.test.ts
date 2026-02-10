import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { AgentStateMachine } from '../../src/core/state/AgentStateMachine.js';
import { SkillContractViolationError } from '../../src/core/errors.js';
import { computeQualityScore } from '../../src/services/quality/QualityScoring.js';
import {
  ChecklistFromRunbookOutputSchema,
  DocPackFromRepoOutputSchema,
  ReleaseNotesFromPRsOutputSchema,
  parseWithFacetRetry,
  runScribeSkill,
} from '../../src/core/contracts/ScribeSkillContracts.js';

const fixturePath = resolve(process.cwd(), 'test/fixtures/golden-traces/scribe-docpack-v1.json');
const goldenTrace = JSON.parse(readFileSync(fixturePath, 'utf-8')) as {
  input: unknown;
  expected: {
    orderedPaths: string[];
    constraints: string[];
    fsmPath: string[];
    qualityInput: Parameters<typeof computeQualityScore>[0];
    minQualityScore: number;
  };
};

test('Golden Trace replay: DocPackFromRepo is deterministic and schema-valid', () => {
  const outputA = runScribeSkill('DocPackFromRepo', goldenTrace.input);
  const outputB = runScribeSkill('DocPackFromRepo', goldenTrace.input);
  DocPackFromRepoOutputSchema.parse(outputA);
  assert.deepStrictEqual(outputA, outputB);
  assert.deepStrictEqual(outputA.sections.files.map((file) => file.path), goldenTrace.expected.orderedPaths);
  assert.deepStrictEqual(outputA.sections.constraints, goldenTrace.expected.constraints);
});

test('FACET contract retry succeeds on second attempt and fails when invalid persists', () => {
  const ok = parseWithFacetRetry('DocPackFromRepo', DocPackFromRepoOutputSchema, (attempt) => {
    if (attempt === 1) return { skill: 'DocPackFromRepo', version: '1.0', sections: {}, markdown: '' };
    return runScribeSkill('DocPackFromRepo', goldenTrace.input);
  });
  DocPackFromRepoOutputSchema.parse(ok);

  assert.throws(
    () =>
      parseWithFacetRetry('ReleaseNotesFromPRs', ReleaseNotesFromPRsOutputSchema, () => ({
        skill: 'ReleaseNotesFromPRs',
        version: '1.0',
        sections: {},
        markdown: '',
      })),
    (error: unknown) => error instanceof SkillContractViolationError && error.code === 'CONTRACT_VIOLATION'
  );
});

test('Behavioral layer: FSM transition order follows golden path', () => {
  const fsm = new AgentStateMachine('pending');
  const path = [fsm.getState()];
  fsm.start();
  path.push(fsm.getState());
  fsm.awaitApproval();
  path.push(fsm.getState());
  fsm.resume();
  path.push(fsm.getState());
  fsm.complete();
  path.push(fsm.getState());
  assert.deepStrictEqual(path, goldenTrace.expected.fsmPath);
});

test('Quality layer: golden trace quality score is above threshold', () => {
  const result = computeQualityScore(goldenTrace.expected.qualityInput);
  assert.ok(result.score >= goldenTrace.expected.minQualityScore, `expected >=${goldenTrace.expected.minQualityScore}, got ${result.score}`);
});

test('Other skill schemas remain contract-compliant', () => {
  ChecklistFromRunbookOutputSchema.parse(
    runScribeSkill('ChecklistFromRunbook', {
      runbookTitle: 'Staging Golden Path',
      steps: [{ title: 'Check /ready', action: 'curl /ready', verification: 'ready=true', mandatory: true }],
    })
  );
  ReleaseNotesFromPRsOutputSchema.parse(
    runScribeSkill('ReleaseNotesFromPRs', {
      releaseVersion: 'v0.5.0',
      pullRequests: [{ number: 7, title: 'Add docpack skill', labels: ['feature'], mergedAt: '2026-02-09T10:00:00Z' }],
      breakingChanges: [],
    })
  );
});
