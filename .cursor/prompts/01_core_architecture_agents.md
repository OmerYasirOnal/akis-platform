# Prompt: Implement Core Agent Contracts, FSM, Orchestrator, and Scribe skeleton

## Goals
- Implement core contracts and state machine.
- Implement AgentFactory (Registry).
- Implement a minimal ScribeAgent that reads a playbook and returns a stub result.

### 1) Core Contracts & FSM
Create files with the following minimal content:

// src/core/contracts/AgentContract.ts
```ts
export interface AgentContract {
  id: string;
  name: string;
  version: string;
  enabled: boolean;
}

export type AgentState = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentInfo {
  id: string;
  name: string;
  version: string;
  state: AgentState;
  mission?: string;
}

export interface AgentInput { [key: string]: any }
export interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
}

// src/core/contracts/AgentPlaybook.ts

export interface AgentPlaybook {
  mission: string;
  capabilities: string[];
  rules: string[];
  behavior?: Record<string, any>;
  constraints?: Record<string, any>;
}

// src/core/agents/IAgent.ts

import { AgentInput, AgentResult, AgentState, AgentInfo } from '../contracts/AgentContract.js';
export interface IAgent {
  execute(input: AgentInput): Promise<AgentResult>;
  getState(): AgentState;
  getInfo(): AgentInfo;
}

// src/core/state/AgentStateMachine.ts

import { AgentState } from '../contracts/AgentContract.js';

export function canTransition(from: AgentState, to: AgentState): boolean {
  if (to === 'running') return from === 'pending';
  if (to === 'completed' || to === 'failed') return from === 'running';
  return false;
}

// src/core/agents/BaseAgent.ts

import { IAgent } from './IAgent.js';
import { AgentInput, AgentResult, AgentState, AgentInfo, AgentContract } from '../contracts/AgentContract.js';
import { AgentPlaybook } from '../contracts/AgentPlaybook.js';
import { canTransition } from '../state/AgentStateMachine.js';

export abstract class BaseAgent implements IAgent {
  protected state: AgentState = 'pending';
  constructor(protected contract: AgentContract, protected playbook: AgentPlaybook) {}

  protected transition(next: AgentState) {
    if (!canTransition(this.state, next)) throw new Error(`Invalid transition ${this.state} -> ${next}`);
    this.state = next;
  }

  getState(): AgentState { return this.state; }
  getInfo(): AgentInfo {
    return { id: this.contract.id, name: this.contract.name, version: this.contract.version, state: this.state, mission: this.playbook?.mission };
  }

  abstract execute(input: AgentInput): Promise<AgentResult>;
}

2) Factory + Registry

// src/core/agents/AgentFactory.ts

import type { IAgent } from './IAgent.js';

type AgentCtor = () => IAgent;
const registry = new Map<string, AgentCtor>();

export function registerAgent(type: string, ctor: AgentCtor) {
  registry.set(type, ctor);
}

export function createAgent(type: string): IAgent {
  const ctor = registry.get(type);
  if (!ctor) throw new Error(`Unknown agent type: ${type}`);
  return ctor();
}

3) Orchestrator

// src/core/orchestrator/AgentOrchestrator.ts

import type { AgentInput, AgentResult } from '../contracts/AgentContract.js';
import { createAgent } from '../agents/AgentFactory.js';

export class AgentOrchestrator {
  async run(agentType: string, input: AgentInput): Promise<AgentResult> {
    const agent = createAgent(agentType);
    return agent.execute(input);
  }
}

export const Orchestrator = new AgentOrchestrator();

4) Scribe Agent (skeleton)

// src/agents/scribe/ScribePlaybook.json

{
  "mission": "Keep repository documentation consistent and up-to-date",
  "capabilities": ["analyze_repo", "generate_docs", "commit_code"],
  "rules": ["accuracy", "no-hallucination", "cite-sources"]
}

// src/agents/scribe/ScribeAgent.ts

import { BaseAgent } from '../../core/agents/BaseAgent.js';
import type { AgentInput, AgentResult, AgentContract } from '../../core/contracts/AgentContract.js';
import playbookJson from './ScribePlaybook.json' assert { type: 'json' };
import { registerAgent } from '../../core/agents/AgentFactory.js';

const contract: AgentContract = { id: 'scribe', name: 'AKIS Scribe', version: '1.0.0', enabled: true };

export class ScribeAgent extends BaseAgent {
  constructor() { super(contract, playbookJson as any); }
  async execute(input: AgentInput): Promise<AgentResult> {
    this.transition('running');
    // TODO: call AIService/GitHubService via Services layer.
    this.transition('completed');
    return { success: true, data: { note: 'ScribeAgent executed (stub)', input } };
  }
}
registerAgent('scribe', () => new ScribeAgent());

Deliverables: Type-checks, server still starts, factories/orchestrator compile.
