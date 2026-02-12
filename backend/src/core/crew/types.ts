import { z } from 'zod';

// ============================================================================
// Crew Run Configuration
// ============================================================================

export const workerRoleSchema = z.object({
  role: z.string().min(1).max(100),
  agentType: z.enum(['scribe', 'trace', 'proto', 'worker']),
  taskDescription: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#6366F1'),
  contextOverrides: z.record(z.unknown()).optional(),
});

export const crewRunInputSchema = z.object({
  goal: z.string().min(10).max(5000),
  workerRoles: z.array(workerRoleSchema).min(1).max(10),
  mergeStrategy: z.enum(['concatenate', 'synthesize', 'structured']).default('synthesize'),
  failureStrategy: z.enum(['fail_fast', 'best_effort']).default('best_effort'),
  autoApprove: z.boolean().default(false),
  repo: z.string().optional(),
  branch: z.string().optional(),
});

export const crewRunOutputSchema = z.object({
  mergedContent: z.string(),
  workerResults: z.array(z.object({
    role: z.string(),
    jobId: z.string().uuid(),
    status: z.enum(['completed', 'failed']),
    output: z.unknown(),
    tokenUsage: z.number().optional(),
    costUsd: z.number().optional(),
  })),
  taskBoard: z.array(z.object({
    taskId: z.string(),
    title: z.string(),
    status: z.string(),
    assignedTo: z.string().optional(),
  })),
  coordinatorReflection: z.string().optional(),
  messageCount: z.number(),
  totalTokens: z.number(),
  totalCostUsd: z.number(),
});

export type WorkerRole = z.infer<typeof workerRoleSchema>;
export type CrewRunInput = z.infer<typeof crewRunInputSchema>;
export type CrewRunOutput = z.infer<typeof crewRunOutputSchema>;

// ============================================================================
// Crew Run Status
// ============================================================================

export type CrewRunStatus = 'planning' | 'spawning' | 'running' | 'merging' | 'completed' | 'failed';
export type CrewTaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';
export type CrewMessageType = 'chat' | 'task_update' | 'status_report' | 'challenge' | 'directive';
export type MergeStrategy = 'concatenate' | 'synthesize' | 'structured';
export type FailureStrategy = 'fail_fast' | 'best_effort';

// ============================================================================
// Worker Task (decomposed from goal)
// ============================================================================

export interface WorkerTask {
  id: string;
  role: string;
  agentType: string;
  taskDescription: string;
  color: string;
  dependsOn: string[];
  priority: number;
  contextOverrides?: Record<string, unknown>;
}

// ============================================================================
// Crew Member (runtime representation)
// ============================================================================

export interface CrewMember {
  jobId: string;
  role: string;
  agentType: string;
  color: string;
  workerIndex: number;
}

// ============================================================================
// Crew Event Types (SSE)
// ============================================================================

export type CrewEventType =
  | 'crew:status_change'
  | 'crew:worker_spawned'
  | 'crew:worker_completed'
  | 'crew:worker_failed'
  | 'crew:task_created'
  | 'crew:task_claimed'
  | 'crew:task_completed'
  | 'crew:task_blocked'
  | 'crew:message'
  | 'crew:merge_started'
  | 'crew:merge_completed'
  | 'crew:reflection';

export interface CrewEvent {
  type: CrewEventType;
  crewRunId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

// ============================================================================
// Decomposition Plan (from AI)
// ============================================================================

export interface DecompositionPlan {
  tasks: Array<{
    id: string;
    title: string;
    description: string;
    assignToRole: string;
    dependsOn: string[];
    priority: number;
  }>;
  rationale: string;
}

// ============================================================================
// Merge Result
// ============================================================================

export interface MergeResult {
  mergedContent: string;
  workerOutputs: Array<{
    role: string;
    jobId: string;
    output: unknown;
    status: 'completed' | 'failed';
    tokenUsage?: number;
    costUsd?: number;
  }>;
  totalTokens: number;
  totalCostUsd: number;
}

// ============================================================================
// Default Worker Colors (for UI differentiation)
// ============================================================================

export const DEFAULT_WORKER_COLORS = [
  '#10B981', // emerald
  '#6366F1', // indigo
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#06B6D4', // cyan
  '#84CC16', // lime
] as const;
