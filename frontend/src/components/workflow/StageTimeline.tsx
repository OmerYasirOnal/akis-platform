import { useState } from 'react';
import { cn } from '../../utils/cn';
import { StatusBadge } from './StatusBadge';
import { SpecView } from './SpecView';
import type { Workflow, StageResult } from '../../types/workflow';

const STAGE_META = [
  { key: 'scribe' as const, label: 'Scribe', role: 'Idea \u2192 Spec', color: '#38bdf8', icon: '\u25C6' },
  { key: 'approve' as const, label: 'Human Gate', role: 'Human-in-the-loop', color: '#2dd4a8', icon: '\u2713' },
  { key: 'proto' as const, label: 'Proto', role: 'Spec \u2192 Scaffold', color: '#f59e0b', icon: '\u2B21' },
  { key: 'trace' as const, label: 'Trace', role: 'Code \u2192 Tests', color: '#a78bfa', icon: '\u25C8' },
];

interface StageTimelineProps {
  workflow: Workflow;
  onApprove?: () => void;
  onReject?: () => void;
  onRetry?: () => void;
}

function StageContent({ stageKey, stage, workflow, onApprove, onReject, onRetry }: {
  stageKey: string;
  stage: StageResult;
  workflow: Workflow;
  onApprove?: () => void;
  onReject?: () => void;
  onRetry?: () => void;
}) {
  if (stageKey === 'scribe' && stage.status === 'completed' && stage.spec) {
    return <SpecView spec={stage.spec} />;
  }

  if (stageKey === 'approve') {
    if (stage.status === 'completed') {
      return (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-400">
          &#10003; Spec approved by user &middot; Human-in-the-loop gate passed
        </div>
      );
    }
    if (stage.status === 'pending' && workflow.status === 'awaiting_approval') {
      return (
        <div className="space-y-3">
          <p className="text-sm text-[#8492a6]">Review the spec and decide how to proceed.</p>
          <div className="flex gap-2">
            <button
              onClick={onApprove}
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
            >
              Approve &amp; Continue
            </button>
            <button
              onClick={onReject}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
            >
              Reject
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  if (stageKey === 'proto') {
    if (stage.status === 'completed' && stage.branch) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#8492a6]">Branch:</span>
            <code className="rounded bg-[#1a2030] px-2 py-0.5 font-mono text-xs text-[#f59e0b]">{stage.branch}</code>
          </div>
          {stage.files && stage.files.length > 0 && (
            <div>
              <p className="mb-1 text-xs text-[#8492a6]">Files ({stage.files.length}):</p>
              <div className="space-y-0.5">
                {stage.files.map((f, i) => (
                  <p key={i} className="font-mono text-xs text-[#e2e8f0]/70">{f}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
    if (stage.status === 'running') {
      return (
        <div className="flex items-center gap-2 text-sm text-[#8492a6]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#f59e0b]" />
          Generating scaffold...
          {stage.elapsed && <span className="font-mono text-xs">{stage.elapsed}</span>}
        </div>
      );
    }
    return null;
  }

  if (stageKey === 'trace') {
    if (stage.status === 'completed') {
      return (
        <div className="flex gap-6">
          <div>
            <p className="text-2xl font-bold text-[#a78bfa]">{stage.tests ?? 0}</p>
            <p className="text-xs text-[#8492a6]">Tests Written</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#a78bfa]">{stage.coverage ?? 'N/A'}</p>
            <p className="text-xs text-[#8492a6]">Coverage</p>
          </div>
        </div>
      );
    }
    if (stage.status === 'failed') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-red-400">{stage.error || 'Trace failed'}</p>
          <button
            onClick={onRetry}
            className="rounded-lg border border-[#a78bfa]/30 px-3 py-1.5 text-sm font-medium text-[#a78bfa] transition-colors hover:bg-[#a78bfa]/10"
          >
            Retry Trace
          </button>
        </div>
      );
    }
    if (stage.status === 'running') {
      return (
        <div className="flex items-center gap-2 text-sm text-[#8492a6]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#a78bfa]" />
          Writing tests...
        </div>
      );
    }
    return null;
  }

  return null;
}

export function StageTimeline({ workflow, onApprove, onReject, onRetry }: StageTimelineProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(() => {
    // Auto-expand the current active stage
    if (workflow.status === 'awaiting_approval') return 'approve';
    const stages = workflow.stages;
    if (stages.trace.status === 'running' || stages.trace.status === 'failed') return 'trace';
    if (stages.proto.status === 'running') return 'proto';
    if (stages.scribe.status === 'completed' && stages.scribe.spec) return 'scribe';
    return null;
  });

  return (
    <div className="space-y-0">
      {STAGE_META.map((meta, idx) => {
        const stage = workflow.stages[meta.key];
        const isExpanded = expandedStage === meta.key;
        const isLast = idx === STAGE_META.length - 1;
        const hasContent = stage.status !== 'idle';

        return (
          <div key={meta.key} className="relative">
            {/* Connector line */}
            {!isLast && (
              <div
                className={cn(
                  'absolute left-[16px] top-[34px] w-0.5',
                  isExpanded ? 'h-[calc(100%-34px)]' : 'h-[calc(100%-14px)]',
                  stage.status === 'completed' ? 'bg-emerald-500/40' : 'bg-[#1e2738]',
                )}
              />
            )}

            {/* Stage header */}
            <button
              onClick={() => hasContent && setExpandedStage(isExpanded ? null : meta.key)}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors',
                hasContent && 'cursor-pointer hover:bg-[#1a2030]',
                !hasContent && 'cursor-default opacity-50',
              )}
            >
              {/* Stage icon */}
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-bold"
                style={{
                  background: stage.status === 'completed' ? `${meta.color}18` : stage.status === 'running' ? `${meta.color}18` : '#1e273830',
                  color: stage.status !== 'idle' ? meta.color : '#4a5568',
                  border: `1.5px solid ${stage.status !== 'idle' ? meta.color : '#4a556830'}`,
                }}
              >
                {meta.icon}
              </div>

              {/* Label + role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#e2e8f0]">{meta.label}</span>
                  <span className="text-xs text-[#4a5568]">{meta.role}</span>
                </div>
                {stage.confidence && (
                  <span className="text-xs text-[#8492a6]">Confidence: {stage.confidence}%</span>
                )}
              </div>

              {/* Status badge */}
              {stage.status !== 'idle' && <StatusBadge status={stage.status} size="small" />}

              {/* Expand indicator */}
              {hasContent && (
                <svg
                  className={cn('h-4 w-4 text-[#4a5568] transition-transform', isExpanded && 'rotate-180')}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              )}
            </button>

            {/* Expanded content */}
            {isExpanded && hasContent && (
              <div className="ml-11 mt-1 mb-3 rounded-lg border border-[#1e2738] bg-[#131820] p-4">
                <StageContent
                  stageKey={meta.key}
                  stage={stage}
                  workflow={workflow}
                  onApprove={onApprove}
                  onReject={onReject}
                  onRetry={onRetry}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
