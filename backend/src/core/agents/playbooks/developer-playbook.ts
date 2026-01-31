import type { AgentPlaybook } from './types.js';

export const developerPlaybook: AgentPlaybook = {
  agentType: 'developer',
  displayName: 'Developer',
  description: 'Full-stack development agent with Claude-code-like workflow. Plans, executes multi-step development tasks, and reflects on output quality.',
  phases: [
    { id: 'plan', label: 'Planning', description: 'Breaking goal into executable steps', icon: 'clipboard' },
    { id: 'init', label: 'Initializing', description: 'Setting up development context', icon: 'settings' },
    { id: 'step', label: 'Executing', description: 'Running development steps sequentially', icon: 'terminal' },
    { id: 'review', label: 'Reviewing', description: 'Validating output and running checks', icon: 'eye' },
    { id: 'publish', label: 'Publishing', description: 'Committing and creating PR', icon: 'upload', estimatedDurationMs: 15000 },
  ],
  requiredFields: [
    { name: 'goal', type: 'string', label: 'Development Goal', required: true, placeholder: 'Describe what you want to build or fix...' },
    { name: 'requirements', type: 'string', label: 'Requirements', required: false, placeholder: 'Additional requirements or constraints' },
    { name: 'maxSteps', type: 'string', label: 'Max Steps', required: false, placeholder: '10', defaultValue: '10' },
  ],
  capabilities: ['full-stack-dev', 'plan-execute-reflect', 'github-integration', 'step-by-step', 'auditable-logs'],
  outputArtifacts: ['implementation', 'execution-log', 'review-critique'],
};
