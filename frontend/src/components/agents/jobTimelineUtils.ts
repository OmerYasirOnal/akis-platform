/**
 * Utility functions for JobTimeline component.
 * Separated to satisfy react-refresh/only-export-components lint rule.
 */

import type { PhaseStatus } from './JobTimeline';

/**
 * Derive timeline phases from job state and trace events.
 * Maps backend states to the visual FSM phases.
 */
export function derivePhases(
  jobState: string | undefined,
  traceEvents?: Array<{ eventType?: string; stepId?: string; status?: string; title?: string }>,
): { phases: Record<string, PhaseStatus>; activePhase: string; activeStepLabel?: string } {
  const phases: Record<string, PhaseStatus> = {
    intake: 'idle',
    clarify: 'idle',
    plan: 'idle',
    scaffold: 'idle',
    execute: 'idle',
    verify: 'idle',
    report: 'idle',
  };
  let activePhase = 'intake';
  let activeStepLabel: string | undefined;

  if (!jobState || jobState === 'pending') {
    phases.intake = 'active';
    activePhase = 'intake';
    activeStepLabel = 'Awaiting start...';
    return { phases, activePhase, activeStepLabel };
  }

  // Job has started — intake is always done
  phases.intake = 'completed';

  if (jobState === 'waiting_user') {
    phases.clarify = 'waiting';
    activePhase = 'clarify';
    activeStepLabel = 'Waiting for your answer...';
    return { phases, activePhase, activeStepLabel };
  }

  // Use trace events to determine progress
  const stepIds = new Set((traceEvents || []).map(e => e.stepId).filter(Boolean));
  const hasPlanStep = stepIds.has('ai-scaffold') || (traceEvents || []).some(e => e.eventType === 'plan_step');
  const hasScaffold = (traceEvents || []).some(e => e.eventType === 'file_created');
  const hasGithub = (traceEvents || []).some(e => e.stepId === 'github-commit');

  // Clarify is done if we passed it (no waiting_user)
  phases.clarify = 'completed';

  if (jobState === 'running') {
    if (!hasPlanStep && !hasScaffold) {
      phases.plan = 'active';
      activePhase = 'plan';
      activeStepLabel = 'AI analyzing requirements...';
    } else if (hasPlanStep && !hasScaffold) {
      phases.plan = 'completed';
      phases.scaffold = 'active';
      activePhase = 'scaffold';
      activeStepLabel = 'Generating project files...';
    } else if (hasScaffold && !hasGithub) {
      phases.plan = 'completed';
      phases.scaffold = 'completed';
      phases.execute = 'active';
      activePhase = 'execute';
      activeStepLabel = 'Committing to repository...';
    } else {
      phases.plan = 'completed';
      phases.scaffold = 'completed';
      phases.execute = 'completed';
      phases.verify = 'active';
      activePhase = 'verify';
      activeStepLabel = 'Running quality checks...';
    }
  } else if (jobState === 'completed') {
    phases.plan = 'completed';
    phases.scaffold = 'completed';
    phases.execute = 'completed';
    phases.verify = 'completed';
    phases.report = 'completed';
    activePhase = 'report';
  } else if (jobState === 'failed') {
    // Mark up to current phase as completed, current as failed
    phases.plan = hasPlanStep ? 'completed' : 'failed';
    if (hasPlanStep) {
      phases.scaffold = hasScaffold ? 'completed' : 'failed';
      activePhase = hasScaffold ? 'execute' : 'scaffold';
    } else {
      activePhase = 'plan';
    }
    phases[activePhase] = 'failed';
  }

  return { phases, activePhase, activeStepLabel };
}
