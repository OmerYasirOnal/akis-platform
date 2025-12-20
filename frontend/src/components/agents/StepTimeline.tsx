/**
 * StepTimeline - Product-grade timeline with step grouping and filters
 * 
 * Features:
 * - Groups events by stepId into logical workflow steps
 * - Filter tabs: All / Reasoning / Tools / Files / Errors
 * - Expandable step cards with sub-events
 * - Safe display of reasoning summaries (no raw chain-of-thought)
 */

import { useState, useMemo } from 'react';
import type { JobTraceEvent } from '../../services/api/types';

// ============================================================================
// Types
// ============================================================================

type FilterType = 'all' | 'reasoning' | 'tools' | 'files' | 'errors';

interface StepGroup {
  stepId: string;
  stepName: string;
  events: JobTraceEvent[];
  status: 'running' | 'completed' | 'failed' | 'info';
  startTime: string;
  endTime?: string;
  totalDuration: number;
}

interface StepTimelineProps {
  traces: JobTraceEvent[];
}

// ============================================================================
// Constants & Helpers
// ============================================================================

const EVENT_ICONS: Record<string, string> = {
  'step_start': '▶',
  'step_complete': '✓',
  'step_failed': '✕',
  'doc_read': '📄',
  'file_created': '📝',
  'file_modified': '✏️',
  'mcp_connect': '🔌',
  'mcp_call': '⚡',
  'ai_call': '🤖',
  'ai_parse_error': '⚠',
  'tool_call': '🔧',
  'tool_result': '📤',
  'decision': '🎯',
  'plan_step': '📋',
  'reasoning': '💭',
  'error': '❌',
  'info': 'ℹ️',
};

const STEP_LABELS: Record<string, string> = {
  'branch-setup': 'Branch Setup',
  'analyze-content': 'Content Analysis',
  'generate-content': 'Content Generation',
  'reflect-critique': 'Quality Review',
  'commit-changes': 'Commit Changes',
  'create-pr': 'Pull Request',
  'completion': 'Completed',
};

function getEventIcon(type: string): string {
  return EVENT_ICONS[type] || '•';
}

function getStepLabel(stepId: string): string {
  return STEP_LABELS[stepId] || stepId.split('-').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function getStepStatus(events: JobTraceEvent[]): StepGroup['status'] {
  if (events.some(e => e.eventType === 'step_failed' || e.eventType === 'error')) return 'failed';
  if (events.some(e => e.eventType === 'step_complete')) return 'completed';
  if (events.some(e => e.eventType === 'step_start')) return 'running';
  return 'info';
}

function matchesFilter(event: JobTraceEvent, filter: FilterType): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'reasoning':
      return Boolean(event.reasoningSummary || event.eventType === 'reasoning' || event.eventType === 'decision');
    case 'tools':
      return Boolean(event.toolName || event.eventType === 'tool_call' || event.eventType === 'tool_result' || event.eventType === 'mcp_call');
    case 'files':
      return ['doc_read', 'file_created', 'file_modified'].includes(event.eventType);
    case 'errors':
      return event.eventType === 'error' || event.eventType === 'step_failed' || event.status === 'failed';
    default:
      return true;
  }
}

// ============================================================================
// Sub-components
// ============================================================================

interface FilterTabProps {
  active: FilterType;
  counts: Record<FilterType, number>;
  onChange: (filter: FilterType) => void;
}

function FilterTabs({ active, counts, onChange }: FilterTabProps) {
  const tabs: { id: FilterType; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '📋' },
    { id: 'reasoning', label: 'Reasoning', icon: '💭' },
    { id: 'tools', label: 'Tools', icon: '🔧' },
    { id: 'files', label: 'Files', icon: '📄' },
    { id: 'errors', label: 'Errors', icon: '❌' },
  ];

  return (
    <div className="flex flex-wrap gap-2 p-1 bg-ak-surface-2 rounded-lg border border-ak-border">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-all ${
            active === tab.id
              ? 'bg-ak-primary text-white shadow-sm'
              : 'text-ak-text-secondary hover:text-ak-text-primary hover:bg-ak-surface-3'
          }`}
        >
          <span>{tab.icon}</span>
          <span>{tab.label}</span>
          {counts[tab.id] > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              active === tab.id ? 'bg-white/20' : 'bg-ak-surface-3'
            }`}>
              {counts[tab.id]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

interface StepCardProps {
  step: StepGroup;
  filter: FilterType;
  isExpanded: boolean;
  onToggle: () => void;
}

function StepCard({ step, filter, isExpanded, onToggle }: StepCardProps) {
  const filteredEvents = step.events.filter(e => matchesFilter(e, filter));
  
  const statusStyles: Record<StepGroup['status'], string> = {
    'running': 'border-l-blue-500 bg-blue-500/5',
    'completed': 'border-l-emerald-500 bg-emerald-500/5',
    'failed': 'border-l-red-500 bg-red-500/5',
    'info': 'border-l-ak-border bg-ak-surface-2',
  };

  const statusIcons: Record<StepGroup['status'], string> = {
    'running': '🔄',
    'completed': '✅',
    'failed': '❌',
    'info': 'ℹ️',
  };

  if (filteredEvents.length === 0 && filter !== 'all') {
    return null;
  }

  return (
    <div className={`border-l-4 rounded-lg border border-ak-border overflow-hidden ${statusStyles[step.status]}`}>
      {/* Step Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-ak-surface-3/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{statusIcons[step.status]}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ak-text-primary">
                {step.stepName}
              </span>
              <span className="text-xs text-ak-text-secondary">
                ({filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''})
              </span>
            </div>
            <div className="text-xs text-ak-text-secondary mt-0.5">
              {new Date(step.startTime).toLocaleTimeString()}
              {step.totalDuration > 0 && ` • ${formatDuration(step.totalDuration)}`}
            </div>
          </div>
        </div>
        <span className="text-ak-text-secondary text-sm">
          {isExpanded ? '▼' : '▶'}
        </span>
      </button>

      {/* Expanded Events */}
      {isExpanded && (
        <div className="border-t border-ak-border bg-ak-surface/50">
          {filteredEvents.map((event, idx) => (
            <EventRow key={event.id} event={event} isLast={idx === filteredEvents.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

interface EventRowProps {
  event: JobTraceEvent;
  isLast: boolean;
}

function EventRow({ event, isLast }: EventRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const hasDetails = Boolean(
    event.reasoningSummary || event.askedWhat || event.didWhat || 
    event.whyReason || event.inputSummary || event.outputSummary || event.detail
  );

  return (
    <div className={`${isLast ? '' : 'border-b border-ak-border/50'}`}>
      {/* Event Header Row */}
      <div 
        className={`flex items-start gap-3 p-3 ${hasDetails ? 'cursor-pointer hover:bg-ak-surface-3/30' : ''}`}
        onClick={() => hasDetails && setShowDetails(!showDetails)}
      >
        {/* Icon */}
        <span className="w-6 h-6 flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
          {getEventIcon(event.eventType)}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-ak-text-primary">
              {event.title}
            </span>
            {event.toolName && (
              <code className="text-xs px-1.5 py-0.5 bg-ak-surface-3 rounded text-ak-text-secondary">
                {event.toolName}
              </code>
            )}
            {event.durationMs && (
              <span className="text-xs text-ak-text-secondary">
                {formatDuration(event.durationMs)}
              </span>
            )}
          </div>

          {/* Quick preview of reasoning if available */}
          {event.reasoningSummary && !showDetails && (
            <p className="text-xs text-ak-text-secondary mt-1 line-clamp-1" data-testid="reasoning-preview">
              💭 {event.reasoningSummary}
            </p>
          )}
        </div>

        {/* Expand indicator */}
        {hasDetails && (
          <span className="text-xs text-ak-text-secondary flex-shrink-0">
            {showDetails ? '▼' : '▶'}
          </span>
        )}
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="px-3 pb-3 space-y-3 ml-9">
          {/* Reasoning Summary - highlighted */}
          {event.reasoningSummary && (
            <div 
              className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3"
              data-testid="reasoning-summary"
            >
              <div className="text-xs text-purple-400 font-medium mb-1">💭 Reasoning</div>
              <p className="text-sm text-ak-text-primary">{event.reasoningSummary}</p>
            </div>
          )}

          {/* Asked / Did / Why grid */}
          {(event.askedWhat || event.didWhat || event.whyReason) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {event.askedWhat && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="text-xs text-blue-400 font-medium mb-1">❓ Asked</div>
                  <p className="text-sm text-ak-text-primary">{event.askedWhat}</p>
                </div>
              )}
              {event.didWhat && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <div className="text-xs text-emerald-400 font-medium mb-1">✓ Did</div>
                  <p className="text-sm text-ak-text-primary">{event.didWhat}</p>
                </div>
              )}
              {event.whyReason && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <div className="text-xs text-amber-400 font-medium mb-1">💡 Why</div>
                  <p className="text-sm text-ak-text-primary">{event.whyReason}</p>
                </div>
              )}
            </div>
          )}

          {/* Input/Output summaries */}
          {event.inputSummary && (
            <div className="bg-ak-surface-3 rounded-lg p-3">
              <div className="text-xs text-ak-text-secondary font-medium mb-1">📥 Input</div>
              <pre className="text-xs font-mono whitespace-pre-wrap text-ak-text-primary">
                {event.inputSummary}
              </pre>
            </div>
          )}
          {event.outputSummary && (
            <div className="bg-ak-surface-3 rounded-lg p-3">
              <div className="text-xs text-ak-text-secondary font-medium mb-1">📤 Output</div>
              <pre className="text-xs font-mono whitespace-pre-wrap text-ak-text-primary">
                {event.outputSummary}
              </pre>
            </div>
          )}

          {/* Raw detail fallback (only if no structured fields) */}
          {!event.reasoningSummary && !event.askedWhat && !event.didWhat && event.detail && (
            <details className="text-xs">
              <summary className="text-ak-text-secondary cursor-pointer hover:text-ak-text-primary">
                View raw details
              </summary>
              <pre className="mt-2 p-2 bg-ak-surface-3 rounded font-mono overflow-x-auto">
                {JSON.stringify(event.detail, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function StepTimeline({ traces }: StepTimelineProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Group events by stepId
  const stepGroups = useMemo(() => {
    const groups = new Map<string, JobTraceEvent[]>();
    const ungrouped: JobTraceEvent[] = [];

    traces.forEach(event => {
      const stepId = event.stepId || 'ungrouped';
      if (stepId === 'ungrouped') {
        ungrouped.push(event);
      } else {
        if (!groups.has(stepId)) {
          groups.set(stepId, []);
        }
        groups.get(stepId)!.push(event);
      }
    });

    // Convert to StepGroup array
    const result: StepGroup[] = [];
    
    groups.forEach((events, stepId) => {
      const sortedEvents = events.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const totalDuration = sortedEvents.reduce((sum, e) => sum + (e.durationMs || 0), 0);
      
      result.push({
        stepId,
        stepName: getStepLabel(stepId),
        events: sortedEvents,
        status: getStepStatus(sortedEvents),
        startTime: sortedEvents[0].timestamp,
        endTime: sortedEvents[sortedEvents.length - 1].timestamp,
        totalDuration,
      });
    });

    // Add ungrouped events as a separate group if any
    if (ungrouped.length > 0) {
      result.push({
        stepId: 'ungrouped',
        stepName: 'Other Events',
        events: ungrouped,
        status: getStepStatus(ungrouped),
        startTime: ungrouped[0].timestamp,
        endTime: ungrouped[ungrouped.length - 1].timestamp,
        totalDuration: ungrouped.reduce((sum, e) => sum + (e.durationMs || 0), 0),
      });
    }

    // Sort by start time
    return result.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }, [traces]);

  // Calculate filter counts
  const filterCounts = useMemo(() => {
    const counts: Record<FilterType, number> = {
      all: traces.length,
      reasoning: 0,
      tools: 0,
      files: 0,
      errors: 0,
    };

    traces.forEach(event => {
      if (matchesFilter(event, 'reasoning')) counts.reasoning++;
      if (matchesFilter(event, 'tools')) counts.tools++;
      if (matchesFilter(event, 'files')) counts.files++;
      if (matchesFilter(event, 'errors')) counts.errors++;
    });

    return counts;
  }, [traces]);

  // Toggle step expansion
  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  // Expand/collapse all
  const expandAll = () => {
    setExpandedSteps(new Set(stepGroups.map(s => s.stepId)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  if (traces.length === 0) {
    return (
      <div className="text-center py-12 text-ak-text-secondary" data-testid="timeline-empty">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm">No execution trace available yet.</p>
        <p className="text-xs mt-1">Events will appear as the job executes.</p>
      </div>
    );
  }

  // Filter visible groups
  const visibleGroups = stepGroups.filter(group => 
    group.events.some(e => matchesFilter(e, filter))
  );

  return (
    <div className="space-y-4" data-testid="step-timeline">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <FilterTabs active={filter} counts={filterCounts} onChange={setFilter} />
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-ak-text-secondary">
            {stepGroups.length} step{stepGroups.length !== 1 ? 's' : ''} • {traces.length} event{traces.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-1 border-l border-ak-border pl-2 ml-2">
            <button
              onClick={expandAll}
              className="px-2 py-1 text-xs text-ak-primary hover:bg-ak-surface-3 rounded"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-2 py-1 text-xs text-ak-primary hover:bg-ak-surface-3 rounded"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Step Cards */}
      <div className="space-y-3">
        {visibleGroups.map(step => (
          <StepCard
            key={step.stepId}
            step={step}
            filter={filter}
            isExpanded={expandedSteps.has(step.stepId)}
            onToggle={() => toggleStep(step.stepId)}
          />
        ))}
      </div>

      {visibleGroups.length === 0 && (
        <div className="text-center py-8 text-ak-text-secondary">
          <p className="text-sm">No events match the selected filter.</p>
        </div>
      )}
    </div>
  );
}

export default StepTimeline;

