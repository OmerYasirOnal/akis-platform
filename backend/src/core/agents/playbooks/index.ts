export type { AgentPhase, AgentPlaybook } from './types.js';
export { scribePlaybook } from './scribe-playbook.js';
export { tracePlaybook } from './trace-playbook.js';
export { protoPlaybook } from './proto-playbook.js';

import { AgentPlaybook } from './types.js';
import { scribePlaybook } from './scribe-playbook.js';
import { tracePlaybook } from './trace-playbook.js';
import { protoPlaybook } from './proto-playbook.js';

// NOTE: coder and developer playbooks shelved for S0.5.
// See: _shelved/README.md for reactivation.
const playbooks: Record<string, AgentPlaybook> = {
  scribe: scribePlaybook,
  trace: tracePlaybook,
  proto: protoPlaybook,
};

export function getPlaybook(agentType: string): AgentPlaybook | undefined {
  return playbooks[agentType];
}

export function getAllPlaybooks(): AgentPlaybook[] {
  return Object.values(playbooks);
}
