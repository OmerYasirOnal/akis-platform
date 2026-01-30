export type { AgentPhase, AgentPlaybook } from './types.js';
export { scribePlaybook } from './scribe-playbook.js';
export { tracePlaybook } from './trace-playbook.js';
export { protoPlaybook } from './proto-playbook.js';
export { coderPlaybook } from './coder-playbook.js';
export { developerPlaybook } from './developer-playbook.js';

import { AgentPlaybook } from './types.js';
import { scribePlaybook } from './scribe-playbook.js';
import { tracePlaybook } from './trace-playbook.js';
import { protoPlaybook } from './proto-playbook.js';
import { coderPlaybook } from './coder-playbook.js';
import { developerPlaybook } from './developer-playbook.js';

const playbooks: Record<string, AgentPlaybook> = {
  scribe: scribePlaybook,
  trace: tracePlaybook,
  proto: protoPlaybook,
  coder: coderPlaybook,
  developer: developerPlaybook,
};

export function getPlaybook(agentType: string): AgentPlaybook | undefined {
  return playbooks[agentType];
}

export function getAllPlaybooks(): AgentPlaybook[] {
  return Object.values(playbooks);
}
