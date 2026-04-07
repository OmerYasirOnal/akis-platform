import type { Pipeline, PipelineStage } from '../types/pipeline';
import type { ChatMessage, ConversationUIState, ConversationListItem, ConversationStatus } from '../types/chat';

/**
 * Maps a backend PipelineStage to the frontend ConversationUIState.
 */
export function mapStageToUIState(stage: PipelineStage): ConversationUIState {
  switch (stage) {
    case 'scribe_clarifying':
    case 'scribe_generating':
      return 'scribe_running';
    case 'awaiting_approval':
      return 'awaiting_approval';
    case 'proto_building':
      return 'proto_running';
    case 'trace_testing':
      return 'trace_running';
    case 'ci_running':
      return 'ci_running';
    case 'completed':
    case 'completed_partial':
    case 'failed':
    case 'cancelled':
    default:
      return 'idle';
  }
}

/**
 * Maps a PipelineStage to a sidebar status indicator.
 */
export function mapStageToConversationStatus(stage: PipelineStage): ConversationStatus {
  switch (stage) {
    case 'scribe_clarifying':
    case 'scribe_generating':
    case 'proto_building':
    case 'trace_testing':
    case 'ci_running':
      return 'running';
    case 'awaiting_approval':
      return 'awaiting_approval';
    case 'failed':
      return 'error';
    default:
      return 'idle';
  }
}

/**
 * Maps a backend Pipeline to a ConversationListItem for the sidebar.
 */
export function mapPipelineToConversationItem(pipeline: Pipeline): ConversationListItem {
  const repoName = pipeline.protoConfig?.repoName ?? pipeline.title ?? 'Untitled';
  const owner = pipeline.protoOutput?.repo?.split('/')?.[0] ?? '';

  return {
    id: pipeline.id,
    title: pipeline.title ?? repoName,
    repoFullName: owner ? `${owner}/${repoName}` : repoName,
    repoShortName: repoName,
    status: mapStageToConversationStatus(pipeline.stage),
    fileCount: pipeline.protoOutput?.files?.length ?? 0,
    lastActivity: pipeline.updatedAt,
    branch: pipeline.protoOutput?.branch,
    prUrl: pipeline.protoOutput?.prUrl,
    prNumber: undefined,
  };
}

/**
 * Maps the scribeConversation array from a Pipeline into ChatMessage[].
 */
export function mapPipelineToChatMessages(pipeline: Pipeline): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const now = new Date().toISOString();

  for (const msg of pipeline.scribeConversation ?? []) {
    switch (msg.type) {
      case 'user_idea':
        messages.push({ type: 'user', content: msg.content as string, timestamp: now });
        break;
      case 'user_answer':
        messages.push({ type: 'user', content: msg.content as string, timestamp: now });
        break;
      case 'clarification': {
        const clar = msg.content as { message?: string; questions?: unknown[] };
        messages.push({
          type: 'agent',
          agent: 'scribe',
          content: clar.message ?? 'Birkaç sorum var:',
          timestamp: now,
        });
        break;
      }
      case 'spec_draft': {
        const draft = msg.content as { spec?: unknown; confidence?: number };
        if (draft.spec) {
          messages.push({
            type: 'agent',
            agent: 'scribe',
            content: 'Plan hazır. Lütfen inceleyin ve onaylayın.',
            timestamp: now,
          });
        }
        break;
      }
      case 'spec_approved':
        messages.push({ type: 'info', content: 'Plan onaylandı.', timestamp: now });
        break;
      case 'spec_rejected':
        messages.push({ type: 'info', content: 'Plan reddedildi.', timestamp: now });
        break;
    }
  }

  // Proto result
  if (pipeline.protoOutput?.ok) {
    const po = pipeline.protoOutput;
    messages.push({
      type: 'pr_opened',
      url: po.prUrl ?? po.repoUrl ?? '',
      number: 0,
      title: `Scaffold: ${pipeline.title ?? ''}`,
      branch: po.branch,
      filesChanged: po.files?.length ?? 0,
      linesChanged: po.metadata?.totalLinesOfCode ?? 0,
      timestamp: now,
    });
  }

  // Trace result
  if (pipeline.traceOutput) {
    const to = pipeline.traceOutput;
    messages.push({
      type: 'test_result',
      passed: to.testSummary?.totalTests ?? 0,
      failed: 0,
      total: to.testSummary?.totalTests ?? 0,
      coverage: to.testSummary?.coveragePercentage?.toString() ?? '0',
      timestamp: now,
    });
  }

  // Error
  if (pipeline.error) {
    messages.push({
      type: 'error',
      agent: pipeline.stage.split('_')[0],
      message: pipeline.error.message,
      retryable: pipeline.error.retryable,
      timestamp: now,
    });
  }

  return messages;
}

/**
 * Returns the running agent name for the current stage.
 */
export function getRunningAgentName(state: ConversationUIState): string | null {
  switch (state) {
    case 'scribe_running':
    case 'scribe_revise':
      return 'Scribe';
    case 'proto_running':
      return 'Proto';
    case 'trace_running':
      return 'Trace';
    case 'ci_running':
      return 'CI';
    default:
      return null;
  }
}
