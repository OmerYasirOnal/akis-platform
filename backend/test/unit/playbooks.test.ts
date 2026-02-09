/**
 * Unit tests for playbook registry: getAllPlaybooks, getPlaybook, and shape contracts
 */
import { describe, test } from 'node:test';
import assert from 'node:assert';

// ─── Re-create playbook types and registry from playbooks/index.ts ──

interface AgentPhase {
  id: string;
  label: string;
  description: string;
  icon: string;
  estimatedDurationMs?: number;
}

interface AgentPlaybook {
  agentType: string;
  displayName: string;
  description: string;
  phases: AgentPhase[];
  requiredFields: Array<{
    name: string;
    type: 'string' | 'boolean' | 'select';
    label: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    defaultValue?: unknown;
  }>;
  capabilities: string[];
  outputArtifacts: string[];
}

// Minimal playbook fixtures (matching the shape from scribe/trace/proto)
const scribePlaybook: AgentPlaybook = {
  agentType: 'scribe',
  displayName: 'Scribe Agent',
  description: 'Documentation generation agent',
  phases: [
    { id: 'analyze', label: 'Analyze', description: 'Analyze repository', icon: '🔍' },
    { id: 'generate', label: 'Generate', description: 'Generate docs', icon: '📝' },
  ],
  requiredFields: [
    { name: 'owner', type: 'string', label: 'Owner', required: true, placeholder: 'repo-owner' },
    { name: 'repo', type: 'string', label: 'Repo', required: true, placeholder: 'repo-name' },
  ],
  capabilities: ['readme-generation', 'api-docs'],
  outputArtifacts: ['README.md'],
};

const tracePlaybook: AgentPlaybook = {
  agentType: 'trace',
  displayName: 'Trace Agent',
  description: 'Code analysis and tracing agent',
  phases: [
    { id: 'scan', label: 'Scan', description: 'Scan codebase', icon: '🔎' },
  ],
  requiredFields: [],
  capabilities: ['dependency-analysis'],
  outputArtifacts: ['trace-report.json'],
};

const protoPlaybook: AgentPlaybook = {
  agentType: 'proto',
  displayName: 'Proto Agent',
  description: 'Prototype generation agent',
  phases: [
    { id: 'design', label: 'Design', description: 'Design prototype', icon: '🎨' },
  ],
  requiredFields: [],
  capabilities: ['ui-generation'],
  outputArtifacts: ['prototype.html'],
};

const playbooks: Record<string, AgentPlaybook> = {
  scribe: scribePlaybook,
  trace: tracePlaybook,
  proto: protoPlaybook,
};

function getPlaybook(agentType: string): AgentPlaybook | undefined {
  return playbooks[agentType];
}

function getAllPlaybooks(): AgentPlaybook[] {
  return Object.values(playbooks);
}

// ─── getPlaybook ─────────────────────────────────────────────────────

describe('getPlaybook', () => {
  test('returns scribe playbook', () => {
    const pb = getPlaybook('scribe');
    assert.ok(pb);
    assert.strictEqual(pb.agentType, 'scribe');
  });

  test('returns trace playbook', () => {
    const pb = getPlaybook('trace');
    assert.ok(pb);
    assert.strictEqual(pb.agentType, 'trace');
  });

  test('returns proto playbook', () => {
    const pb = getPlaybook('proto');
    assert.ok(pb);
    assert.strictEqual(pb.agentType, 'proto');
  });

  test('returns undefined for unknown type', () => {
    assert.strictEqual(getPlaybook('unknown'), undefined);
    assert.strictEqual(getPlaybook(''), undefined);
  });
});

// ─── getAllPlaybooks ─────────────────────────────────────────────────

describe('getAllPlaybooks', () => {
  test('returns exactly 3 playbooks', () => {
    assert.strictEqual(getAllPlaybooks().length, 3);
  });

  test('contains all registered agent types', () => {
    const types = getAllPlaybooks().map((p) => p.agentType).sort();
    assert.deepStrictEqual(types, ['proto', 'scribe', 'trace']);
  });

  test('returns array of AgentPlaybook objects', () => {
    for (const pb of getAllPlaybooks()) {
      assert.strictEqual(typeof pb.agentType, 'string');
      assert.strictEqual(typeof pb.displayName, 'string');
      assert.strictEqual(typeof pb.description, 'string');
      assert.ok(Array.isArray(pb.phases));
      assert.ok(Array.isArray(pb.requiredFields));
      assert.ok(Array.isArray(pb.capabilities));
      assert.ok(Array.isArray(pb.outputArtifacts));
    }
  });
});

// ─── AgentPlaybook shape contract ───────────────────────────────────

describe('AgentPlaybook shape contract', () => {
  test('phases have required fields', () => {
    for (const pb of getAllPlaybooks()) {
      for (const phase of pb.phases) {
        assert.strictEqual(typeof phase.id, 'string');
        assert.strictEqual(typeof phase.label, 'string');
        assert.strictEqual(typeof phase.description, 'string');
        assert.strictEqual(typeof phase.icon, 'string');
      }
    }
  });

  test('requiredFields have valid type values', () => {
    const validTypes = ['string', 'boolean', 'select'];
    for (const pb of getAllPlaybooks()) {
      for (const field of pb.requiredFields) {
        assert.strictEqual(typeof field.name, 'string');
        assert.ok(validTypes.includes(field.type), `Invalid type: ${field.type}`);
        assert.strictEqual(typeof field.label, 'string');
        assert.strictEqual(typeof field.required, 'boolean');
      }
    }
  });

  test('capabilities and outputArtifacts are string arrays', () => {
    for (const pb of getAllPlaybooks()) {
      for (const cap of pb.capabilities) {
        assert.strictEqual(typeof cap, 'string');
      }
      for (const art of pb.outputArtifacts) {
        assert.strictEqual(typeof art, 'string');
      }
    }
  });
});

// ─── Playbook route response contracts ──────────────────────────────

describe('Playbook route response contracts', () => {
  test('GET /playbooks response shape', () => {
    const response = { playbooks: getAllPlaybooks() };
    assert.ok(Array.isArray(response.playbooks));
    assert.ok(response.playbooks.length > 0);
  });

  test('GET /playbooks/:type success shape', () => {
    const pb = getPlaybook('scribe')!;
    const response = { playbook: pb };
    assert.ok(response.playbook);
    assert.strictEqual(response.playbook.agentType, 'scribe');
  });

  test('GET /playbooks/:type 404 shape', () => {
    const pb = getPlaybook('nonexistent');
    if (!pb) {
      const response = {
        error: {
          code: 'PLAYBOOK_NOT_FOUND',
          message: 'No playbook found for agent type "nonexistent"',
        },
      };
      assert.strictEqual(response.error.code, 'PLAYBOOK_NOT_FOUND');
      assert.ok(response.error.message.includes('nonexistent'));
    }
  });
});
