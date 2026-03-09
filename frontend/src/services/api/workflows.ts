/**
 * Workflow API wrapper — wraps pipeline backend endpoints with "workflow" terminology.
 * Backend endpoints remain /api/pipelines/*; frontend says "workflow".
 */
import { HttpClient } from './HttpClient';
import { getApiBaseUrl } from './config';
import type { Workflow, WorkflowStages, WorkflowStatus, StageResult } from '../../types/workflow';
import type { Pipeline, PipelineStage, ScribeOutput, ProtoOutput, TraceOutput } from '../../../../pipeline/frontend/types';

const http = new HttpClient(getApiBaseUrl());

function mapStageStatus(pipelineStage: PipelineStage): { workflowStatus: WorkflowStatus; stages: WorkflowStages } {
  const idle: StageResult = { status: 'idle' };

  const stages: WorkflowStages = {
    scribe: { ...idle },
    approve: { ...idle },
    proto: { ...idle },
    trace: { ...idle },
  };

  let workflowStatus: WorkflowStatus = 'pending';

  switch (pipelineStage) {
    case 'scribe_clarifying':
    case 'scribe_generating':
      stages.scribe.status = 'running';
      workflowStatus = 'running';
      break;
    case 'awaiting_approval':
      stages.scribe.status = 'completed';
      stages.approve.status = 'pending';
      workflowStatus = 'awaiting_approval';
      break;
    case 'proto_building':
      stages.scribe.status = 'completed';
      stages.approve.status = 'completed';
      stages.proto.status = 'running';
      workflowStatus = 'running';
      break;
    case 'trace_testing':
      stages.scribe.status = 'completed';
      stages.approve.status = 'completed';
      stages.proto.status = 'completed';
      stages.trace.status = 'running';
      workflowStatus = 'running';
      break;
    case 'completed':
      stages.scribe.status = 'completed';
      stages.approve.status = 'completed';
      stages.proto.status = 'completed';
      stages.trace.status = 'completed';
      workflowStatus = 'completed';
      break;
    case 'completed_partial':
      stages.scribe.status = 'completed';
      stages.approve.status = 'completed';
      stages.proto.status = 'completed';
      stages.trace.status = 'failed';
      workflowStatus = 'completed_partial';
      break;
    case 'failed':
      workflowStatus = 'failed';
      stages.scribe.status = 'completed';
      break;
    case 'cancelled':
      workflowStatus = 'cancelled';
      break;
  }

  return { workflowStatus, stages };
}

function mapScribeOutput(scribeOutput?: ScribeOutput): Partial<StageResult> {
  if (!scribeOutput) return {};
  const spec = scribeOutput.spec;
  return {
    confidence: scribeOutput.confidence,
    spec: spec ? {
      title: spec.title,
      problemStatement: spec.problemStatement,
      userStories: spec.userStories.map(s => ({
        persona: s.persona,
        as: s.persona,
        action: s.action,
        iWant: s.action,
        benefit: s.benefit,
        soThat: s.benefit,
      })),
      acceptanceCriteria: spec.acceptanceCriteria,
      technicalConstraints: spec.technicalConstraints,
      outOfScope: spec.outOfScope,
    } : undefined,
  };
}

function mapProtoOutput(protoOutput?: ProtoOutput): Partial<StageResult> {
  if (!protoOutput) return {};
  return {
    branch: protoOutput.branch,
    files: protoOutput.files.map(f => f.filePath),
  };
}

function mapTraceOutput(traceOutput?: TraceOutput): Partial<StageResult> {
  if (!traceOutput) return {};
  return {
    tests: traceOutput.testSummary.totalTests,
    coverage: `${traceOutput.testSummary.coveragePercentage}%`,
  };
}

export function mapPipelineToWorkflow(pipeline: Pipeline): Workflow {
  const { workflowStatus, stages } = mapStageStatus(pipeline.stage);

  // Enrich stages with actual output data
  const scribeData = mapScribeOutput(pipeline.scribeOutput);
  stages.scribe = { ...stages.scribe, ...scribeData };

  if (pipeline.metrics.scribeCompletedAt) {
    stages.scribe.endTime = pipeline.metrics.scribeCompletedAt;
  }
  if (pipeline.metrics.approvedAt) {
    stages.approve.status = 'completed';
    stages.approve.endTime = pipeline.metrics.approvedAt;
  }

  const protoData = mapProtoOutput(pipeline.protoOutput);
  stages.proto = { ...stages.proto, ...protoData };
  if (pipeline.metrics.protoCompletedAt) {
    stages.proto.endTime = pipeline.metrics.protoCompletedAt;
  }

  const traceData = mapTraceOutput(pipeline.traceOutput);
  stages.trace = { ...stages.trace, ...traceData };
  if (pipeline.metrics.traceCompletedAt) {
    stages.trace.endTime = pipeline.metrics.traceCompletedAt;
  }

  // If pipeline has error, mark the current running stage as failed
  if (pipeline.error) {
    if (stages.trace.status === 'running' || pipeline.stage === 'trace_testing') {
      stages.trace.status = 'failed';
      stages.trace.error = pipeline.error.message;
    } else if (stages.proto.status === 'running' || pipeline.stage === 'proto_building') {
      stages.proto.status = 'failed';
      stages.proto.error = pipeline.error.message;
    } else if (stages.scribe.status === 'running') {
      stages.scribe.status = 'failed';
      stages.scribe.error = pipeline.error.message;
    }
  }

  return {
    id: pipeline.id,
    title: pipeline.title || pipeline.scribeConversation?.[0]?.type === 'user_idea'
      ? (pipeline.title || (pipeline.scribeConversation[0] as { content: string }).content.slice(0, 60))
      : (pipeline.title || 'Untitled Workflow'),
    status: workflowStatus,
    createdAt: pipeline.createdAt,
    updatedAt: pipeline.updatedAt,
    stages,
  };
}

export const workflowsApi = {
  list: async (): Promise<Workflow[]> => {
    const pipelines = await http.get<Pipeline[]>('/api/pipelines');
    return (Array.isArray(pipelines) ? pipelines : []).map(mapPipelineToWorkflow);
  },

  get: async (id: string): Promise<Workflow> => {
    const pipeline = await http.get<Pipeline>(`/api/pipelines/${id}`);
    return mapPipelineToWorkflow(pipeline);
  },

  create: async (data: { idea: string; targetRepo?: string }): Promise<Workflow> => {
    const pipeline = await http.post<Pipeline>('/api/pipelines', data);
    return mapPipelineToWorkflow(pipeline);
  },

  approve: async (id: string): Promise<Workflow> => {
    const pipeline = await http.post<Pipeline>(`/api/pipelines/${id}/approve`);
    return mapPipelineToWorkflow(pipeline);
  },

  reject: async (id: string, feedback?: string): Promise<Workflow> => {
    const pipeline = await http.post<Pipeline>(`/api/pipelines/${id}/reject`, feedback ? { feedback } : undefined);
    return mapPipelineToWorkflow(pipeline);
  },

  retry: async (id: string): Promise<Workflow> => {
    const pipeline = await http.post<Pipeline>(`/api/pipelines/${id}/retry`);
    return mapPipelineToWorkflow(pipeline);
  },

  skipTrace: async (id: string): Promise<Workflow> => {
    const pipeline = await http.post<Pipeline>(`/api/pipelines/${id}/skip-trace`);
    return mapPipelineToWorkflow(pipeline);
  },

  cancel: async (id: string): Promise<void> => {
    await http.delete(`/api/pipelines/${id}`);
  },

  poll: async (id: string): Promise<Workflow> => {
    const pipeline = await http.get<Pipeline>(`/api/pipelines/${id}`);
    return mapPipelineToWorkflow(pipeline);
  },
};
