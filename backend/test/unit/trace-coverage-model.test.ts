import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeFlowCoverage } from '../../src/agents/trace/FlowCoverage.js';
import { analyzeEdgeCaseCoverage } from '../../src/agents/trace/EdgeCaseCatalog.js';
import { computeRiskWeightedCoverage } from '../../src/agents/trace/RiskModel.js';

describe('Trace coverage model', () => {
  it('computes flow coverage and critical flow rates', () => {
    const summary = computeFlowCoverage([
      {
        name: 'Login flow',
        steps: ['Given valid user', 'When credentials submitted', 'Then dashboard loads'],
      },
      {
        name: 'Profile update flow',
        steps: ['Given profile page'],
      },
    ]);

    assert.strictEqual(summary.totalFlows, 2);
    assert.strictEqual(summary.coveredFlows, 1);
    assert.ok(summary.coverageRate < 1);
    assert.ok(summary.criticalFlows >= 1);
  });

  it('analyzes mandatory edge-case categories and ASVS flags', () => {
    const summary = analyzeEdgeCaseCoverage([
      {
        name: 'Auth + session test',
        steps: ['Verify login token', 'Validate session timeout'],
      },
      {
        name: 'RBAC deny check',
        steps: ['User without permission gets forbidden'],
      },
      {
        name: 'i18n and accessibility path',
        steps: ['Check locale switch', 'Run keyboard navigation checks'],
      },
    ]);

    assert.strictEqual(summary.asvsCoverage.v2Auth, true);
    assert.strictEqual(summary.asvsCoverage.v3Session, true);
    assert.strictEqual(summary.asvsCoverage.v4AccessControl, true);
    assert.ok(summary.coveredCategories >= 4);
    assert.ok(summary.coverageRate > 0);
  });

  it('computes risk-weighted coverage with priority weights', () => {
    const summary = computeRiskWeightedCoverage([
      { name: 'Auth hardening', priority: 'P0', steps: ['Given auth', 'When token invalid', 'Then deny access'] },
      { name: 'List screen', priority: 'P2', steps: ['Given page'] },
      { name: 'Tooltip styling', priority: 'P3', steps: ['Given tooltip', 'When hover', 'Then style updates'] },
    ]);

    assert.ok(summary.maxRiskPoints > 0);
    assert.ok(summary.weightedCoverage <= 1);
    assert.ok(summary.rawCoverage <= 1);
    assert.ok(summary.buckets.P0.weightedTotal > summary.buckets.P3.weightedTotal);
  });
});

