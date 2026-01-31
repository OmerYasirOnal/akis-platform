import { AgentPlaybook } from './types.js';

export const tracePlaybook: AgentPlaybook = {
  agentType: 'trace',
  displayName: 'Trace Agent',
  description: 'Generates test plans and coverage matrices from specifications.',
  phases: [
    {
      id: 'thinking',
      label: 'Thinking',
      description: 'Analyzing test specification',
      icon: '🧠',
      estimatedDurationMs: 3000,
    },
    {
      id: 'discovery',
      label: 'Discovery',
      description: 'Parsing scenarios and test cases',
      icon: '🔍',
      estimatedDurationMs: 5000,
    },
    {
      id: 'creating',
      label: 'Creating',
      description: 'Generating test plan and coverage matrix',
      icon: '✍️',
      estimatedDurationMs: 20000,
    },
    {
      id: 'publishing',
      label: 'Publishing',
      description: 'Committing test artifacts to repository',
      icon: '🚀',
      estimatedDurationMs: 8000,
    },
    {
      id: 'done',
      label: 'Done',
      description: 'Test plan generation complete',
      icon: '✅',
    },
  ],
  requiredFields: [
    {
      name: 'spec',
      type: 'string',
      label: 'Test Specification',
      required: true,
      placeholder: 'Paste your test specification text here...',
    },
    {
      name: 'owner',
      type: 'string',
      label: 'Repository Owner',
      required: false,
      placeholder: 'e.g. octocat',
    },
    {
      name: 'repo',
      type: 'string',
      label: 'Repository Name',
      required: false,
      placeholder: 'e.g. my-project',
    },
    {
      name: 'baseBranch',
      type: 'string',
      label: 'Base Branch',
      required: false,
      placeholder: 'e.g. main',
      defaultValue: 'main',
    },
    {
      name: 'dryRun',
      type: 'boolean',
      label: 'Dry Run',
      required: false,
      defaultValue: false,
    },
  ],
  capabilities: [
    'Gherkin scenario parsing',
    'Multi-scenario support',
    'Coverage matrix generation',
    'Test file scaffolding',
    'GitHub integration',
  ],
  outputArtifacts: [
    'test-plan',
    'coverage-matrix',
    'test-scaffolds',
  ],
};
