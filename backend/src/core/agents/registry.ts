import { AgentFactory } from './AgentFactory.js';
import { ScribeAgent } from '../../agents/scribe/ScribeAgent.js';
import { TraceAgent } from '../../agents/trace/TraceAgent.js';
import { ProtoAgent } from '../../agents/proto/ProtoAgent.js';

/**
 * Register all agents with the factory
 * This ensures no direct agent instantiation outside the factory
 */
export function registerAgents(): void {
  AgentFactory.register('scribe', ScribeAgent);
  AgentFactory.register('trace', TraceAgent);
  AgentFactory.register('proto', ProtoAgent);
}

