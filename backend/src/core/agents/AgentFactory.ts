import { IAgent } from './IAgent';
import { AgentType } from '../contracts/AgentContract';

type AgentConstructor = new (...args: any[]) => IAgent;

export class AgentFactory {
  private static registry: Map<AgentType, AgentConstructor> = new Map();

  static register(type: AgentType, ctor: AgentConstructor): void {
    if (this.registry.has(type)) throw new Error(`Agent type already registered: ${type}`);
    this.registry.set(type, ctor);
  }

  static create(type: AgentType, ...args: any[]): IAgent {
    const ctor = this.registry.get(type);
    if (!ctor) throw new Error(`Unknown agent type: ${type}`);
    return new ctor(...args);
  }
}


