import * as vscode from 'vscode';
import { AkisApiClient } from './services/AkisApiClient.js';
import { FileIndexer } from './services/FileIndexer.js';
import { AkisAgentTreeProvider, AkisJobTreeProvider } from './providers/AkisTreeProvider.js';
import { AkisStatusBar } from './providers/AkisStatusBar.js';
import { AkisTerminalProvider } from './providers/AkisTerminalProvider.js';
import { AgentChatPanel } from './views/AgentChatPanel.js';
import { JobDetailPanel } from './views/JobDetailPanel.js';
import { runAgent } from './commands/runAgent.js';
import { indexWorkspace } from './commands/indexWorkspace.js';
import { searchCode } from './commands/searchCode.js';

let statusBar: AkisStatusBar | undefined;
let jobTreeProvider: AkisJobTreeProvider | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('AKIS IDE');
  outputChannel.appendLine('AKIS IDE extension activating...');

  // Core services
  const apiClient = new AkisApiClient();
  const fileIndexer = new FileIndexer();
  const terminalProvider = new AkisTerminalProvider();

  // Sidebar tree providers
  const agentTreeProvider = new AkisAgentTreeProvider(apiClient);
  jobTreeProvider = new AkisJobTreeProvider(apiClient);

  vscode.window.createTreeView('akis-agents', {
    treeDataProvider: agentTreeProvider,
    showCollapseAll: false,
  });

  vscode.window.createTreeView('akis-jobs', {
    treeDataProvider: jobTreeProvider,
    showCollapseAll: false,
  });

  // Status bar
  statusBar = new AkisStatusBar(apiClient);
  statusBar.startPolling();

  // Start job polling
  jobTreeProvider.startPolling();

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('akis.openChat', (agentType?: string) => {
      AgentChatPanel.createOrShow(
        context.extensionUri,
        apiClient,
        agentType || vscode.workspace.getConfiguration('akis').get('defaultAgent', 'scribe'),
      );
    }),

    vscode.commands.registerCommand('akis.runAgent', () => {
      runAgent(apiClient, context.extensionUri);
    }),

    vscode.commands.registerCommand('akis.indexWorkspace', () => {
      indexWorkspace(fileIndexer);
    }),

    vscode.commands.registerCommand('akis.searchCode', () => {
      searchCode(fileIndexer);
    }),

    vscode.commands.registerCommand('akis.sendTerminalOutput', async () => {
      const output = terminalProvider.getActiveTerminalOutput();
      if (output) {
        if (AgentChatPanel.currentPanel) {
          vscode.window.showInformationMessage('AKIS: Terminal output sent to agent chat');
        } else {
          vscode.window.showWarningMessage('AKIS: Open an agent chat first');
        }
      } else {
        vscode.window.showWarningMessage('AKIS: No active terminal output');
      }
    }),

    vscode.commands.registerCommand('akis.viewJobDetail', (jobId: string) => {
      JobDetailPanel.createOrShow(apiClient, jobId);
    }),

    vscode.commands.registerCommand('akis.configure', async () => {
      const url = await vscode.window.showInputBox({
        prompt: 'AKIS Server URL',
        value: apiClient.getBaseUrl(),
        placeHolder: 'https://staging.akisflow.com',
      });

      if (url) {
        await vscode.workspace.getConfiguration('akis').update(
          'serverUrl', url, vscode.ConfigurationTarget.Global,
        );

        const token = await vscode.window.showInputBox({
          prompt: 'API Token (leave empty for cookie auth)',
          password: true,
        });

        if (token !== undefined) {
          await vscode.workspace.getConfiguration('akis').update(
            'apiToken', token, vscode.ConfigurationTarget.Global,
          );
        }

        apiClient.reload();
        agentTreeProvider.refresh();
        jobTreeProvider?.refresh();
        vscode.window.showInformationMessage('AKIS: Configuration updated');
      }
    }),
  );

  // Auto-index on workspace open if configured
  const autoIndex = vscode.workspace.getConfiguration('akis').get('autoIndex', false);
  if (autoIndex) {
    indexWorkspace(fileIndexer);
  }

  // Watch for config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('akis')) {
        apiClient.reload();
        outputChannel.appendLine('AKIS: Configuration reloaded');
      }
    }),
  );

  // Cleanup
  context.subscriptions.push({
    dispose: () => {
      statusBar?.dispose();
      jobTreeProvider?.stopPolling();
      terminalProvider.dispose();
    },
  });

  outputChannel.appendLine('AKIS IDE extension activated successfully.');
  outputChannel.appendLine(`Server: ${apiClient.getBaseUrl()}`);
  outputChannel.appendLine(`Indexed: ${fileIndexer.entryCount} symbols`);
}

export function deactivate(): void {
  statusBar?.dispose();
  jobTreeProvider?.stopPolling();
}
