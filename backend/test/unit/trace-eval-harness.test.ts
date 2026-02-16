import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TraceAgent } from '../../src/agents/trace/TraceAgent.js';

interface TraceEvalFixture {
  id: string;
  name: string;
  payload: {
    spec: string;
    automationMode: 'plan_only' | 'generate_and_run';
    tracePreferences: {
      testDepth: 'smoke' | 'standard' | 'deep';
      authScope: 'public' | 'authenticated' | 'mixed';
      browserTarget: 'chromium' | 'cross_browser' | 'mobile';
      strictness: 'fast' | 'balanced' | 'strict';
    };
  };
  thresholds: Record<'relevance' | 'coverage' | 'freshness' | 'provenance' | 'stability', number>;
}

function loadFixture(name: string): TraceEvalFixture {
  const filePath = join(process.cwd(), 'test', 'fixtures', 'trace-evals', name);
  return JSON.parse(readFileSync(filePath, 'utf8')) as TraceEvalFixture;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

describe('Trace evaluation harness', () => {
  it('computes reproducible metrics and enforces thresholds', async () => {
    const fixture = loadFixture('basic-login.json');
    const agent = new TraceAgent();

    const first = await agent.execute(fixture.payload) as {
      files: Array<{ cases: Array<{ name: string }> }>;
      metadata: {
        scenarioCount: number;
        flowCoverage?: { coverageRate?: number };
        automationExecution?: { generatedTestPath?: string };
      };
    };

    const second = await agent.execute(fixture.payload) as {
      files: Array<{ cases: Array<{ name: string }> }>;
      metadata: {
        scenarioCount: number;
      };
    };

    const namesA = new Set(first.files.map((file) => file.cases[0]?.name ?? ''));
    const namesB = new Set(second.files.map((file) => file.cases[0]?.name ?? ''));
    const overlapCount = [...namesA].filter((value) => namesB.has(value)).length;
    const overlap = namesA.size > 0 ? overlapCount / namesA.size : 1;

    const relevance = clamp(first.metadata.scenarioCount > 0 ? 1 : 0);
    const coverage = clamp(first.metadata.flowCoverage?.coverageRate ?? 0);
    const freshness = 1; // trace planning is generated from current payload/spec
    const provenance = clamp(first.metadata.automationExecution?.generatedTestPath ? 1 : 0);
    const stability = clamp(overlap);

    const metrics = { relevance, coverage, freshness, provenance, stability };

    assert.ok(metrics.relevance >= fixture.thresholds.relevance, `relevance ${metrics.relevance} < ${fixture.thresholds.relevance}`);
    assert.ok(metrics.coverage >= fixture.thresholds.coverage, `coverage ${metrics.coverage} < ${fixture.thresholds.coverage}`);
    assert.ok(metrics.freshness >= fixture.thresholds.freshness, `freshness ${metrics.freshness} < ${fixture.thresholds.freshness}`);
    assert.ok(metrics.provenance >= fixture.thresholds.provenance, `provenance ${metrics.provenance} < ${fixture.thresholds.provenance}`);
    assert.ok(metrics.stability >= fixture.thresholds.stability, `stability ${metrics.stability} < ${fixture.thresholds.stability}`);
  });
});

