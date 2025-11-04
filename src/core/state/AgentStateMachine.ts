import type { AgentState } from '../contracts/AgentContract.js';
export function canTransition(from: AgentState, to: AgentState): boolean {
  if (to === 'running') return from === 'pending';
  if (to === 'completed' || to === 'failed') return from === 'running';
  return false;
}


