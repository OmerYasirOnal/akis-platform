import * as vscode from 'vscode';
import { AkisApiClient, AkisJob } from '../services/AkisApiClient.js';

export class JobDetailPanel {
  private static panels = new Map<string, JobDetailPanel>();
  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    private apiClient: AkisApiClient,
    private jobId: string,
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.loadJob();
  }

  static createOrShow(apiClient: AkisApiClient, jobId: string): void {
    const existing = JobDetailPanel.panels.get(jobId);
    if (existing) {
      existing.panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'akisJobDetail',
      `Job: ${jobId.slice(0, 8)}`,
      vscode.ViewColumn.Active,
      { enableScripts: true },
    );

    const instance = new JobDetailPanel(panel, apiClient, jobId);
    JobDetailPanel.panels.set(jobId, instance);
  }

  private async loadJob(): Promise<void> {
    try {
      const job = await this.apiClient.getJob(this.jobId);
      this.panel.webview.html = this.renderJob(job);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      this.panel.webview.html = `<h2>Error loading job</h2><p>${msg}</p>`;
    }
  }

  private renderJob(job: AkisJob): string {
    const stateColor =
      job.state === 'completed' ? '#4caf50' :
      job.state === 'failed' ? '#f44336' :
      job.state === 'running' ? '#2196f3' : '#ff9800';

    const result = job.result ? JSON.stringify(job.result, null, 2) : 'N/A';

    return /*html*/ `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      padding: 16px;
      line-height: 1.6;
    }
    h1 { font-size: 18px; margin-bottom: 16px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .card {
      padding: 12px;
      background: var(--vscode-sideBar-background);
      border-radius: 6px;
      border: 1px solid var(--vscode-panel-border);
    }
    .card .label { font-size: 11px; text-transform: uppercase; opacity: 0.6; }
    .card .value { font-size: 16px; font-weight: 600; margin-top: 4px; }
    .state-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
      color: white;
      background: ${stateColor};
    }
    pre {
      background: var(--vscode-textCodeBlock-background);
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 12px;
      max-height: 400px;
      overflow-y: auto;
    }
    h2 { font-size: 15px; margin: 20px 0 8px; }
  </style>
</head>
<body>
  <h1>Job Details</h1>
  <div class="grid">
    <div class="card">
      <div class="label">Status</div>
      <div class="value"><span class="state-badge">${job.state.toUpperCase()}</span></div>
    </div>
    <div class="card">
      <div class="label">Type</div>
      <div class="value">${job.type}</div>
    </div>
    <div class="card">
      <div class="label">Job ID</div>
      <div class="value" style="font-size:12px;font-family:monospace">${job.id}</div>
    </div>
    <div class="card">
      <div class="label">Created</div>
      <div class="value" style="font-size:13px">${job.createdAt}</div>
    </div>
  </div>
  <h2>Payload</h2>
  <pre>${escapeHtml(JSON.stringify(job.payload, null, 2))}</pre>
  <h2>Result</h2>
  <pre>${escapeHtml(result)}</pre>
</body>
</html>`;

    function escapeHtml(s: string): string {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
  }

  dispose(): void {
    JobDetailPanel.panels.delete(this.jobId);
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
