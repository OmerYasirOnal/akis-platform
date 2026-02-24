/**
 * JobTimeline - Live FSM phase indicator for Proto Agent
 *
 * Displays the full execution lifecycle as a horizontal timeline:
 * Intake → Clarify → Plan → Scaffold → Execute → Verify → Report
 *
 * Each step shows:
 * - Idle state (gray, not started)
 * - Active state (pulsing accent, currently running)
 * - Completed state (green check)
 * - Failed state (red X)
 * - Waiting state (amber pause, waiting_user)
 *
 * Based on literature research: Pang et al. UIST'25 (live timeline for oversight).
 */

interface TimelinePhase {
  id: string;
  label: string;
  icon: string;
}

const PHASES: TimelinePhase[] = [
  { id: 'intake', label: 'Intake', icon: '📥' },
  { id: 'clarify', label: 'Clarify', icon: '💬' },
  { id: 'plan', label: 'Plan', icon: '📋' },
  { id: 'scaffold', label: 'Scaffold', icon: '🏗️' },
  { id: 'execute', label: 'Execute', icon: '⚡' },
  { id: 'verify', label: 'Verify', icon: '✅' },
  { id: 'report', label: 'Report', icon: '📊' },
];

export type PhaseStatus = 'idle' | 'active' | 'completed' | 'failed' | 'waiting';

export interface JobTimelineProps {
  /** Map of phase id to its status */
  phases: Record<string, PhaseStatus>;
  /** Currently active phase id (for pulse animation) */
  activePhase?: string;
  /** Optional current step label within active phase */
  activeStepLabel?: string;
}

const statusStyles: Record<PhaseStatus, string> = {
  idle: 'bg-white/[0.04] border-white/[0.06] text-ak-text-secondary/40',
  active: 'bg-purple-500/15 border-purple-400/40 text-purple-300 ring-1 ring-purple-400/30',
  completed: 'bg-emerald-500/10 border-emerald-400/30 text-emerald-400',
  failed: 'bg-red-500/10 border-red-400/30 text-red-400',
  waiting: 'bg-amber-500/10 border-amber-400/30 text-amber-400',
};

const connectorStyles: Record<PhaseStatus, string> = {
  idle: 'bg-white/[0.06]',
  active: 'bg-purple-400/40',
  completed: 'bg-emerald-400/30',
  failed: 'bg-red-400/30',
  waiting: 'bg-amber-400/30',
};

const statusIndicator: Record<PhaseStatus, string> = {
  idle: '',
  active: '◉',
  completed: '✓',
  failed: '✗',
  waiting: '⏸',
};

export default function JobTimeline({ phases, activePhase, activeStepLabel }: JobTimelineProps) {
  return (
    <div className="w-full">
      {/* Timeline row */}
      <div className="flex items-center gap-0">
        {PHASES.map((phase, index) => {
          const status = phases[phase.id] || 'idle';
          const isActive = phase.id === activePhase;
          const isLast = index === PHASES.length - 1;

          return (
            <div key={phase.id} className="flex items-center flex-1 min-w-0">
              {/* Phase node */}
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={`relative flex items-center justify-center w-9 h-9 rounded-lg border backdrop-blur-sm transition-all duration-300 ${statusStyles[status]} ${
                    isActive ? 'animate-pulse' : ''
                  }`}
                >
                  <span className="text-sm leading-none">{phase.icon}</span>
                  {status !== 'idle' && (
                    <span className="absolute -top-1 -right-1 text-[10px] font-bold leading-none">
                      {statusIndicator[status]}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium truncate max-w-[60px] text-center transition-colors ${
                    status === 'active' ? 'text-purple-300' :
                    status === 'completed' ? 'text-emerald-400/80' :
                    status === 'failed' ? 'text-red-400/80' :
                    status === 'waiting' ? 'text-amber-400/80' :
                    'text-ak-text-secondary/50'
                  }`}
                >
                  {phase.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 mx-1">
                  <div
                    className={`h-[2px] rounded-full transition-all duration-500 ${
                      connectorStyles[status === 'completed' || status === 'failed' ? status : 'idle']
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active step label */}
      {activeStepLabel && (
        <div className="mt-2 flex items-center gap-2 px-1">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span className="text-xs text-purple-300/80 truncate">{activeStepLabel}</span>
        </div>
      )}
    </div>
  );
}
