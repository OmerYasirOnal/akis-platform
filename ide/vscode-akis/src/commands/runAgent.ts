import * as vscode from 'vscode';
import { AkisApiClient } from '../services/AkisApiClient.js';
import { AgentChatPanel } from '../views/AgentChatPanel.js';

export async function runAgent(
  apiClient: AkisApiClient,
  extensionUri: vscode.Uri,
  preselectedAgent?: string,
): Promise<void> {
  const agentType = preselectedAgent || await vscode.window.showQuickPick(
    [
      { label: 'Scribe', description: 'Generate docs, changelogs', detail: 'scribe' },
      { label: 'Trace', description: 'Generate test plans & code', detail: 'trace' },
      { label: 'Proto', description: 'Bootstrap MVP scaffolds', detail: 'proto' },
      { label: 'Piri', description: 'RAG knowledge engine', detail: 'piri' },
    ],
    { placeHolder: 'Select an agent to run' },
  ).then(item => item?.detail);

  if (!agentType) {
    return;
  }

  AgentChatPanel.createOrShow(extensionUri, apiClient, agentType);
}
