import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { SecuritySignalCollector } from '../../src/services/knowledge/security/SecuritySignalCollector.js';

describe('SecuritySignalCollector', () => {
  it('normalizes severity values safely', () => {
    assert.equal(SecuritySignalCollector.normalizeSeverity('critical'), 'critical');
    assert.equal(SecuritySignalCollector.normalizeSeverity('HIGH'), 'high');
    assert.equal(SecuritySignalCollector.normalizeSeverity('medium'), 'medium');
    assert.equal(SecuritySignalCollector.normalizeSeverity('low'), 'low');
    assert.equal(SecuritySignalCollector.normalizeSeverity('informational'), 'unknown');
    assert.equal(SecuritySignalCollector.normalizeSeverity(undefined), 'unknown');
  });

  it('maps severity to deterministic risk score', () => {
    assert.equal(SecuritySignalCollector.computeRiskScore('critical'), 1);
    assert.equal(SecuritySignalCollector.computeRiskScore('high'), 0.85);
    assert.equal(SecuritySignalCollector.computeRiskScore('medium'), 0.6);
    assert.equal(SecuritySignalCollector.computeRiskScore('low'), 0.3);
    assert.equal(SecuritySignalCollector.computeRiskScore('unknown'), 0.2);
  });
});
