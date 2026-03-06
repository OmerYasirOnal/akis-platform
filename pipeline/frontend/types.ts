/**
 * Pipeline frontend types — mirrors backend contracts for UI consumption.
 * Kept separate so frontend doesn't depend on backend module resolution.
 */

export type PipelineStage =
  | 'scribe_clarifying'
  | 'scribe_generating'
  | 'awaiting_approval'
  | 'proto_building'
  | 'trace_testing'
  | 'completed'
  | 'completed_partial'
  | 'failed'
  | 'cancelled';

export interface ScribeClarification {
  questions: Array<{
    id: string;
    question: string;
    reason: string;
    suggestions?: string[];
  }>;
}

export interface StructuredSpec {
  title: string;
  problemStatement: string;
  userStories: Array<{ persona: string; action: string; benefit: string }>;
  acceptanceCriteria: Array<{ id: string; given: string; when: string; then: string }>;
  technicalConstraints: { stack?: string; integrations?: string[]; nonFunctional?: string[] };
  outOfScope: string[];
}

export interface ScribeOutput {
  spec: StructuredSpec;
  rawMarkdown: string;
  confidence: number;
  clarificationsAsked: number;
}

export type ScribeMessage =
  | { type: 'user_idea'; content: string }
  | { type: 'clarification'; content: ScribeClarification }
  | { type: 'user_answer'; content: string }
  | { type: 'spec_draft'; content: ScribeOutput }
  | { type: 'spec_approved'; content: StructuredSpec }
  | { type: 'spec_rejected'; content: { feedback: string } };

export interface ProtoOutput {
  ok: boolean;
  branch: string;
  repo: string;
  repoUrl: string;
  files: Array<{ filePath: string; content: string; linesOfCode: number }>;
  prUrl?: string;
  setupCommands: string[];
  metadata: { filesCreated: number; totalLinesOfCode: number; stackUsed: string; committed: boolean };
}

export interface TraceOutput {
  ok: boolean;
  testFiles: Array<{ filePath: string; content: string; testCount: number }>;
  coverageMatrix: Record<string, string[]>;
  testSummary: {
    totalTests: number;
    coveragePercentage: number;
    coveredCriteria: string[];
    uncoveredCriteria: string[];
  };
  branch?: string;
  prUrl?: string;
}

export interface PipelineError {
  code: string;
  message: string;
  technicalDetail?: string;
  retryable: boolean;
  recoveryAction?: 'retry' | 'edit_spec' | 'reconnect_github' | 'start_over';
}

export interface PipelineMetrics {
  startedAt: string;
  scribeCompletedAt?: string;
  approvedAt?: string;
  protoCompletedAt?: string;
  traceCompletedAt?: string;
  totalDurationMs?: number;
  clarificationRounds: number;
  retryCount: number;
}

export interface Pipeline {
  id: string;
  userId: string;
  stage: PipelineStage;
  title?: string;
  scribeConversation: ScribeMessage[];
  scribeOutput?: ScribeOutput;
  approvedSpec?: StructuredSpec;
  protoOutput?: ProtoOutput;
  traceOutput?: TraceOutput;
  protoConfig?: { repoName: string; repoVisibility: 'public' | 'private' };
  metrics: PipelineMetrics;
  error?: PipelineError;
  createdAt: string;
  updatedAt: string;
}
