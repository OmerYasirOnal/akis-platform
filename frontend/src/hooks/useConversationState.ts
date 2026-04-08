import { useState, useCallback, useMemo } from 'react';
import type { ConversationUIState } from '../types/chat';
import type { PipelineStage } from '../types/pipeline';
import { mapStageToUIState, getRunningAgentName } from '../utils/mapPipelineEvent';

interface ConversationStateReturn {
  uiState: ConversationUIState;
  isInputEnabled: boolean;
  showCancelButton: boolean;
  runningAgentName: string | null;
  inputPlaceholder: string;
  syncFromStage: (stage: PipelineStage) => void;
}

const RUNNING_STATES: ConversationUIState[] = [
  'scribe_running',
  'scribe_revise',
  'proto_running',
  'trace_running',
  'ci_running',
];

export function useConversationState(initialStage?: PipelineStage): ConversationStateReturn {
  const [uiState, setUIState] = useState<ConversationUIState>(
    initialStage ? mapStageToUIState(initialStage) : 'idle',
  );

  const syncFromStage = useCallback((stage: PipelineStage) => {
    setUIState(mapStageToUIState(stage));
  }, []);

  const isInputEnabled = uiState === 'idle' || uiState === 'awaiting_approval';
  const showCancelButton = RUNNING_STATES.includes(uiState);
  const runningAgentName = getRunningAgentName(uiState);

  const inputPlaceholder = useMemo(() => {
    if (uiState === 'awaiting_approval') return 'Planı düzenlemek için yazın veya onaylayın...';
    if (runningAgentName) return `${runningAgentName} çalışıyor...`;
    return 'Projenizi anlatın...';
  }, [uiState, runningAgentName]);

  return {
    uiState,
    isInputEnabled,
    showCancelButton,
    runningAgentName,
    inputPlaceholder,
    syncFromStage,
  };
}
