import type { AgentPlaybook } from './types.js';

export const coderPlaybook: AgentPlaybook = {
  agentType: 'coder',
  displayName: 'Coder',
  description: 'AI-powered code generation agent. Generates code from task descriptions with planning, execution, and reflection phases.',
  phases: [
    { id: 'plan', label: 'Planning', description: 'Analyzing task and creating execution plan', icon: 'clipboard' },
    { id: 'analyze', label: 'Analysis', description: 'Understanding codebase context and requirements', icon: 'search' },
    { id: 'generate', label: 'Generating', description: 'Writing code based on plan', icon: 'code' },
    { id: 'review', label: 'Reviewing', description: 'AI-powered code review and critique', icon: 'eye' },
    { id: 'publish', label: 'Publishing', description: 'Creating branch, committing, and opening PR', icon: 'upload', estimatedDurationMs: 15000 },
  ],
  requiredFields: [
    { name: 'task', type: 'string', label: 'Task Description', required: true, placeholder: 'Describe what code to generate...' },
    { name: 'language', type: 'string', label: 'Language', required: false, placeholder: 'TypeScript, Python, etc.' },
    { name: 'framework', type: 'string', label: 'Framework', required: false, placeholder: 'React, Express, etc.' },
  ],
  capabilities: ['code-generation', 'plan-execute-reflect', 'github-integration', 'multi-language', 'framework-aware'],
  outputArtifacts: ['generated-code', 'execution-plan', 'review-critique'],
};
