import { useState, useCallback, useMemo, useRef } from 'react';
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

const TERMINAL_STAGES: PipelineStage[] = ['completed', 'completed_partial', 'failed'];

export function useConversationState(initialStage?: PipelineStage): ConversationStateReturn {
  const [uiState, setUIState] = useState<ConversationUIState>(
    initialStage ? mapStageToUIState(initialStage) : 'idle',
  );

  // Track the raw pipeline stage so we can distinguish terminal-idle from empty-idle
  const currentStageRef = useRef<PipelineStage | undefined>(initialStage);

  const syncFromStage = useCallback((stage: PipelineStage) => {
    currentStageRef.current = stage;
    setUIState(mapStageToUIState(stage));
  }, []);

  const isInputEnabled = uiState === 'idle' || uiState === 'scribe_clarifying' || uiState === 'awaiting_approval';
  const showCancelButton = RUNNING_STATES.includes(uiState);
  const runningAgentName = getRunningAgentName(uiState);

  const inputPlaceholder = useMemo(() => {
    if (uiState === 'scribe_clarifying') return 'Soruları yanıtlayın...';
    if (uiState === 'awaiting_approval') return 'Planı düzenlemek için yazın veya onaylayın...';
    if (runningAgentName) return `${runningAgentName} çalışıyor...`;
    // Terminal states (completed/failed) — guide user to continue or start fresh
    if (uiState === 'idle' && currentStageRef.current && TERMINAL_STAGES.includes(currentStageRef.current)) {
      return 'Devam etmek için yeni fikir yazın veya önceki projeyi geliştirin...';
    }
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
