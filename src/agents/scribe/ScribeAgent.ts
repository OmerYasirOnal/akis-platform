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


