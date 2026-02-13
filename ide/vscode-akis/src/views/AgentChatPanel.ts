import * as vscode from 'vscode';
import { AkisApiClient } from '../services/AkisApiClient.js';
import { SseStreamClient, JobEvent } from '../services/SseStreamClient.js';

export class AgentChatPanel {
  public static currentPanel: AgentChatPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private disposables: vscode.Disposable[] = [];
  private sseClient: SseStreamClient;
  private currentJobId?: string;

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private apiClient: AkisApiClient,
    private agentType: string,
  ) {
    this.panel = panel;
    this.extensionUri = extensionUri;

    const config = vscode.workspace.getConfiguration('akis');
    this.sseClient = new SseStreamClient(
      config.get<string>('serverUrl', 'https://staging.akisflow.com'),
      config.get<string>('apiToken', ''),
    );

    this.panel.webview.html = this.getHtmlContent();

    this.panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      null,
      this.disposables,
    );

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  static createOrShow(
    extensionUri: vscode.Uri,
    apiClient: AkisApiClient,
    agentType: string,
  ): void {
    const column = vscode.ViewColumn.Beside;

    if (AgentChatPanel.currentPanel) {
      AgentChatPanel.currentPanel.panel.reveal(column);
      AgentChatPanel.currentPanel.switchAgent(agentType);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'akisChat',
      `AKIS: ${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`,
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    );

    AgentChatPanel.currentPanel = new AgentChatPanel(panel, extensionUri, apiClient, agentType);
  }

  private switchAgent(agentType: string): void {
    this.agentType = agentType;
    this.panel.title = `AKIS: ${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`;
    this.panel.webview.postMessage({
      type: 'switchAgent',
      agent: agentType,
    });
  }

  private async handleMessage(message: { type: string; text?: string; jobId?: string }): Promise<void> {
    switch (message.type) {
      case 'sendMessage':
        await this.sendToAgent(message.text || '');
        break;
      case 'streamJob':
        if (message.jobId) {
          this.startJobStream(message.jobId);
        }
        break;
    }
  }

  private async sendToAgent(text: string): Promise<void> {
    try {
      this.panel.webview.postMessage({
        type: 'addMessage',
        role: 'user',
        content: text,
      });

      this.panel.webview.postMessage({
        type: 'addMessage',
        role: 'agent',
        content: 'Starting agent...',
        phase: 'thinking',
      });

      const job = await this.apiClient.createJob({
        agentType: this.agentType,
        payload: { requirements: text },
      });

      this.currentJobId = job.id;

      this.panel.webview.postMessage({
        type: 'jobCreated',
        jobId: job.id,
      });

      this.startJobStream(job.id);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      this.panel.webview.postMessage({
        type: 'addMessage',
        role: 'agent',
        content: `Error: ${errorMsg}`,
        isError: true,
      });
    }
  }

  private startJobStream(jobId: string): void {
    this.sseClient.streamJob(
      jobId,
      (event: JobEvent) => {
        this.panel.webview.postMessage({
          type: 'jobEvent',
          event,
        });
      },
      (error: Error) => {
        this.panel.webview.postMessage({
          type: 'addMessage',
          role: 'agent',
          content: `Stream error: ${error.message}`,
          isError: true,
        });
      },
      () => {
        this.panel.webview.postMessage({
          type: 'streamEnd',
          jobId,
        });
      },
    );
  }

  private getHtmlContent(): string {
    return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      padding: 8px 12px;
      background: var(--vscode-sideBar-background);
      border-bottom: 1px solid var(--vscode-panel-border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .header .agent-name {
      font-weight: 600;
      text-transform: capitalize;
    }
    .header .agent-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .msg {
      max-width: 85%;
      padding: 8px 12px;
      border-radius: 8px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .msg.user {
      align-self: flex-end;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .msg.agent {
      align-self: flex-start;
      background: var(--vscode-editor-inactiveSelectionBackground);
    }
    .msg.thinking {
      opacity: 0.7;
      font-style: italic;
      font-size: 12px;
    }
    .msg.error {
      background: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
    }
    .msg .phase-label {
      font-size: 10px;
      text-transform: uppercase;
      opacity: 0.6;
      margin-bottom: 4px;
    }
    .input-area {
      padding: 8px 12px;
      border-top: 1px solid var(--vscode-panel-border);
      display: flex;
      gap: 8px;
    }
    .input-area textarea {
      flex: 1;
      padding: 8px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 4px;
      resize: none;
      font-family: inherit;
      font-size: inherit;
      min-height: 36px;
      max-height: 120px;
    }
    .input-area textarea:focus {
      outline: 1px solid var(--vscode-focusBorder);
    }
    .input-area button {
      padding: 6px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      white-space: nowrap;
    }
    .input-area button:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .job-id {
      font-size: 11px;
      opacity: 0.5;
      margin-top: 4px;
    }
  </style>
</head>
<body>
  <div class="header">
    <span class="agent-name" id="agentName">${this.agentType}</span>
    <span class="agent-badge" id="agentBadge">Ready</span>
  </div>
  <div class="messages" id="messages"></div>
  <div class="input-area">
    <textarea id="input" rows="1" placeholder="Describe what you want to build..."></textarea>
    <button id="sendBtn">Send</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const messagesEl = document.getElementById('messages');
    const inputEl = document.getElementById('input');
    const sendBtn = document.getElementById('sendBtn');
    const agentNameEl = document.getElementById('agentName');
    const agentBadgeEl = document.getElementById('agentBadge');

    function addMessage(role, content, opts = {}) {
      const div = document.createElement('div');
      div.className = 'msg ' + role;
      if (opts.isError) div.className += ' error';
      if (opts.phase === 'thinking') div.className += ' thinking';

      let html = '';
      if (opts.phase) {
        html += '<div class="phase-label">' + opts.phase + '</div>';
      }
      html += escapeHtml(content);
      if (opts.jobId) {
        html += '<div class="job-id">Job: ' + opts.jobId.slice(0, 8) + '</div>';
      }

      div.innerHTML = html;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function escapeHtml(str) {
      return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function send() {
      const text = inputEl.value.trim();
      if (!text) return;
      inputEl.value = '';
      inputEl.style.height = '36px';
      vscode.postMessage({ type: 'sendMessage', text });
    }

    sendBtn.addEventListener('click', send);
    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    inputEl.addEventListener('input', () => {
      inputEl.style.height = '36px';
      inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
    });

    window.addEventListener('message', (event) => {
      const msg = event.data;
      switch (msg.type) {
        case 'addMessage':
          addMessage(msg.role, msg.content, msg);
          break;
        case 'jobCreated':
          agentBadgeEl.textContent = 'Running';
          break;
        case 'jobEvent':
          handleJobEvent(msg.event);
          break;
        case 'streamEnd':
          agentBadgeEl.textContent = 'Ready';
          break;
        case 'switchAgent':
          agentNameEl.textContent = msg.agent;
          break;
      }
    });

    function handleJobEvent(event) {
      const d = event.data || {};
      const eventType = d.eventType || event.type || 'info';
      let content = d.detail || d.title || JSON.stringify(d);
      let phase = eventType;

      if (eventType === 'reasoning') {
        content = d.reasoningSummary || d.detail || '';
        phase = 'reasoning';
      } else if (eventType === 'decision') {
        content = (d.title || '') + '\\n' + (d.reasoning || '');
        phase = 'decision';
      } else if (eventType === 'plan_step') {
        content = (d.title || '') + ': ' + (d.description || '');
        phase = d.status || 'plan';
      }

      if (content) {
        addMessage('agent', content, { phase });
      }
    }
  </script>
</body>
</html>`;
  }

  appendContext(
    filePath: string,
    content: string,
    lineRange?: { startLine: number; endLine: number },
  ): void {
    const rangeLabel = lineRange ? ` (L${lineRange.startLine}-${lineRange.endLine})` : '';
    this.panel.webview.postMessage({
      type: 'addMessage',
      role: 'system',
      content: `📎 Attached: ${filePath}${rangeLabel}\n\`\`\`\n${content.substring(0, 2000)}${content.length > 2000 ? '\n... (truncated)' : ''}\n\`\`\``,
      phase: 'context',
    });
  }

  dispose(): void {
    AgentChatPanel.currentPanel = undefined;
    this.sseClient.stopAll();
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
