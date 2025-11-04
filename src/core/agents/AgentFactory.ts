import type { IAgent } from './IAgent.js';
type AgentCtor = () => IAgent;
const registry = new Map<string, AgentCtor>();
export function registerAgent(type: string, ctor: AgentCtor) { registry.set(type, ctor); }
export function createAgent(type: string): IAgent {
  const ctor = registry.get(type);
  if (!ctor) throw new Error(`Unknown agent type: ${type}`);
  return ctor();
}


