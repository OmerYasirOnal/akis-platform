import { z } from 'zod';
import { AgentContract } from './AgentContract.js';

const TaskItemSchema = z.object({
  id: z.string(),
  what: z.string().describe('What needs to be done'),
  location: z.string().describe('Where in the codebase (file path or module)'),
  rules: z.array(z.string()).describe('Constraints and patterns to follow'),
  priority: z.enum(['high', 'medium', 'low']).optional(),
  dependencies: z.array(z.string()).optional(),
});

const DeveloperInputSchema = z.object({
  goal: z.string().describe('The development goal to achieve'),
  requirements: z.string().optional(),
  constraints: z.array(z.string()).optional(),
  codebaseContext: z.string().optional(),
  owner: z.string().optional(),
  repo: z.string().optional(),
  baseBranch: z.string().optional(),
  dryRun: z.boolean().optional(),
  maxSteps: z.number().optional(),
});

const DeveloperOutputSchema = z.object({
  tasks: z.array(TaskItemSchema).describe('TASK/LOCATION/RULES items for implementation'),
  summary: z.string().describe('Summary of the development plan'),
  proposedKBUpdates: z.array(z.object({
    title: z.string(),
    content: z.string(),
    docType: z.enum(['repo_doc', 'manual']),
  })).optional().describe('Proposed Knowledge Base updates (will be stored as proposed status)'),
  executionResults: z.array(z.object({
    taskId: z.string(),
    status: z.enum(['completed', 'failed', 'skipped']),
    output: z.string().optional(),
    error: z.string().optional(),
  })).optional(),
  provenance: z.array(z.string()).describe('Sources and references used'),
});

export type DeveloperInput = z.infer<typeof DeveloperInputSchema>;
export type DeveloperOutput = z.infer<typeof DeveloperOutputSchema>;
export type TaskItem = z.infer<typeof TaskItemSchema>;

export class DeveloperContract extends AgentContract<DeveloperInput, DeveloperOutput> {
  inputSchema = DeveloperInputSchema;
  outputSchema = DeveloperOutputSchema;

  static readonly TASK_FORMAT_PROMPT = `
Output must follow this exact format for each task:

TASK (WHAT)
<Clear description of what needs to be done>

LOCATION (WHERE)
<File path or module location>

RULES (CONSTRAINTS & PATTERNS)
- <Rule 1>
- <Rule 2>
...

Ensure all outputs include provenance references when citing existing code or documentation.
If you lack sufficient information, explicitly state what's missing rather than guessing.
`;
}

export const developerContract = new DeveloperContract();
