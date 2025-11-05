import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentDependencies } from '../../core/agents/AgentFactory.js';

/**
 * TraceAgent - Generates test automation code from Jira acceptance criteria
 * Phase 6.A: Deterministic test-skeletons playbook (no external network)
 * Extends BaseAgent; accepts injected tools (MCP adapters, AIService) via constructor
 */
export class TraceAgent extends BaseAgent {
  readonly type = 'trace';
  private deps?: AgentDependencies;

  constructor(deps?: AgentDependencies) {
    super();
    this.deps = deps;
    // TraceAgent does not require planning or reflection (simple agent)
    this.playbook.requiresPlanning = false;
    this.playbook.requiresReflection = false;
  }

  /**
   * Execute deterministic test-skeleton generation
   * Input: { spec: string }
   * Output: { files: Array<{path: string, cases: Array<{name: string, steps: string[]}>}> }
   */
  async execute(context: unknown): Promise<unknown> {
    // Validate input
    if (!context || typeof context !== 'object' || !('spec' in context)) {
      throw new Error('TraceAgent requires payload with "spec" field');
    }

    const payload = context as { spec: string };
    const spec = typeof payload.spec === 'string' ? payload.spec : String(payload.spec);

    // Step 1: Parse spec into test scenarios (deterministic)
    const scenarios = this.parseScenarios(spec);

    // Step 2: Generate test files (stable sort by scenario name)
    const files = this.generateTestFiles(scenarios);

    return {
      ok: true,
      agent: 'trace',
      files,
      metadata: {
        scenarioCount: scenarios.length,
        totalTestCases: files.reduce((sum, f) => sum + f.cases.length, 0),
        specLength: spec.length,
      },
    };
  }

  /**
   * Parse spec into test scenarios (deterministic)
   * Supports formats like:
   * - "Given X When Y Then Z"
   * - "User does X -> system does Y"
   * - "Scenario: name\nGiven X\nWhen Y\nThen Z"
   */
  private parseScenarios(spec: string): Array<{ name: string; steps: string[] }> {
    const scenarios: Array<{ name: string; steps: string[] }> = [];

    // Try Gherkin-style parsing
    const gherkinMatch = spec.match(/Scenario:\s*(.+?)(?:\n|$)/i);
    if (gherkinMatch) {
      const name = gherkinMatch[1].trim();
      const steps: string[] = [];
      
      // Extract Given/When/Then steps
      const stepPattern = /(?:Given|When|Then|And|But)\s+(.+?)(?:\n|$)/gi;
      let stepMatch;
      while ((stepMatch = stepPattern.exec(spec)) !== null) {
        steps.push(stepMatch[1].trim());
      }

      if (steps.length > 0) {
        scenarios.push({ name, steps });
        return scenarios;
      }
    }

    // Try arrow-style parsing: "X -> Y -> Z"
    if (spec.includes('->')) {
      const parts = spec.split('->').map((p) => p.trim());
      if (parts.length >= 2) {
        const name = `Test: ${parts[0]}`;
        scenarios.push({ name, steps: parts });
        return scenarios;
      }
    }

    // Try colon-style parsing: "Action: description"
    const colonMatch = spec.match(/^([^:]+):\s*(.+)$/);
    if (colonMatch) {
      const name = colonMatch[1].trim();
      const description = colonMatch[2].trim();
      scenarios.push({
        name: `Test: ${name}`,
        steps: description.split(/[.,;]/).map((s) => s.trim()).filter((s) => s.length > 0),
      });
      return scenarios;
    }

    // Fallback: treat entire spec as single scenario
    const sentences = spec.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 5);
    if (sentences.length > 0) {
      scenarios.push({
        name: 'Test: Generated from spec',
        steps: sentences,
      });
    } else {
      // Last resort: split by newlines or commas
      const parts = spec.split(/[\n,]+/).map((p) => p.trim()).filter((p) => p.length > 0);
      if (parts.length > 0) {
        scenarios.push({
          name: 'Test: Generated from spec',
          steps: parts,
        });
      }
    }

    return scenarios;
  }

  /**
   * Generate test files (deterministic, stable sort)
   */
  private generateTestFiles(scenarios: Array<{ name: string; steps: string[] }>): Array<{
    path: string;
    cases: Array<{ name: string; steps: string[] }>;
  }> {
    if (scenarios.length === 0) {
      return [
        {
          path: 'tests/generated/default.test.ts',
          cases: [
            {
              name: 'default test case',
              steps: ['No scenarios found in spec'],
            },
          ],
        },
      ];
    }

    // Stable sort by scenario name
    const sortedScenarios = [...scenarios].sort((a, b) => {
      return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    });

    // Group scenarios into files (deterministic: one file per scenario for simplicity)
    return sortedScenarios.map((scenario, idx) => {
      // Generate deterministic path based on scenario name
      const sanitizedName = scenario.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);

      return {
        path: `tests/generated/${sanitizedName || `test-${idx}`}.test.ts`,
        cases: [
          {
            name: scenario.name,
            steps: scenario.steps,
          },
        ],
      };
    });
  }
}

