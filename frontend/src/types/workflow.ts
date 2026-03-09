/**
 * Workflow types — frontend wrapper around pipeline backend contracts.
 * "Workflow" is the UI term; backend still uses "pipeline".
 */

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'completed_partial'
  | 'failed'
  | 'cancelled';

export type StageStatus = 'idle' | 'running' | 'completed' | 'failed' | 'pending';

export interface StructuredSpec {
  title?: string;
  problemStatement: string;
  userStories: Array<{ persona?: string; as?: string; action?: string; iWant?: string; benefit?: string; soThat?: string }>;
  acceptanceCriteria: Array<{ id?: string; given: string; when: string; then: string }>;
  technicalConstraints?: { stack?: string; integrations?: string[]; nonFunctional?: string[] } | string[];
  outOfScope?: string[];
}

export interface StageResult {
  status: StageStatus;
  startTime?: string;
  endTime?: string;
  duration?: string;
  confidence?: number;
  spec?: StructuredSpec | null;
  approvedBy?: string;
  branch?: string;
  files?: string[];
  tests?: number;
  coverage?: string;
  error?: string;
  elapsed?: string;
}

export interface WorkflowStages {
  scribe: StageResult;
  approve: StageResult;
  proto: StageResult;
  trace: StageResult;
}

export interface Workflow {
  id: string;
  title: string;
  status: WorkflowStatus;
  createdAt: string;
  updatedAt?: string;
  stages: WorkflowStages;
}

export interface WorkflowStats {
  total: number;
  completed: number;
  running: number;
  failed: number;
  avgDuration: string;
  testsGenerated: number;
  successRate: number;
  thisWeek: number;
}
