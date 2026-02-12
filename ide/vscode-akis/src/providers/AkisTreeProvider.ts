import * as vscode from 'vscode';
import { AkisApiClient, AkisJob } from '../services/AkisApiClient.js';

type TreeItemType = 'agent' | 'job' | 'message';

export class AgentTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly agentType: string,
    public readonly description_text: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
  ) {
    super(label, collapsibleState);
    this.tooltip = description_text;
    this.description = description_text;
    this.contextValue = 'agent';
    this.iconPath = new vscode.ThemeIcon(AgentTreeItem.iconFor(agentType));

    this.command = {
      command: 'akis.openChat',
      title: 'Open Chat',
      arguments: [agentType],
    };
  }

  static iconFor(type: string): string {
    switch (type) {
      case 'scribe': return 'notebook';
      case 'trace': return 'beaker';
      case 'proto': return 'rocket';
      case 'piri': return 'search';
      default: return 'hubot';
    }
  }
}

export class JobTreeItem extends vscode.TreeItem {
  constructor(public readonly job: AkisJob) {
    super(
      `${job.type} — ${job.state}`,
      vscode.TreeItemCollapsibleState.None,
    );

    const stateIcon = JobTreeItem.stateIcon(job.state);
    this.iconPath = new vscode.ThemeIcon(stateIcon);
    this.description = job.id.slice(0, 8);
    this.tooltip = `Job ${job.id}\nType: ${job.type}\nState: ${job.state}\nCreated: ${job.createdAt}`;
    this.contextValue = 'job';

    this.command = {
      command: 'akis.viewJobDetail',
      title: 'View Job',
      arguments: [job.id],
    };
  }

  static stateIcon(state: string): string {
    switch (state) {
      case 'running': return 'sync~spin';
      case 'completed': return 'check';
      case 'failed': return 'error';
      case 'pending': return 'clock';
      case 'awaiting_approval': return 'question';
      default: return 'circle-outline';
    }
  }
}

export class AkisAgentTreeProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private agents: AgentTreeItem[] = [
    new AgentTreeItem('Scribe', 'scribe', 'Generate docs, changelogs'),
    new AgentTreeItem('Trace', 'trace', 'Generate test plans & code'),
    new AgentTreeItem('Proto', 'proto', 'Bootstrap MVP scaffolds'),
    new AgentTreeItem('Piri', 'piri', 'RAG knowledge engine'),
  ];

  constructor(private apiClient: AkisApiClient) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      return Promise.resolve(this.agents);
    }
    return Promise.resolve([]);
  }
}

export class AkisJobTreeProvider implements vscode.TreeDataProvider<JobTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<JobTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private jobs: AkisJob[] = [];
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private apiClient: AkisApiClient) {}

  startPolling(intervalMs = 10000): void {
    this.fetchJobs();
    this.refreshTimer = setInterval(() => this.fetchJobs(), intervalMs);
  }

  stopPolling(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  refresh(): void {
    this.fetchJobs();
  }

  private async fetchJobs(): Promise<void> {
    try {
      const [running, recent] = await Promise.all([
        this.apiClient.getRunningJobs().catch(() => [] as AkisJob[]),
        this.apiClient.getRecentJobs(10).catch(() => [] as AkisJob[]),
      ]);

      const seen = new Set<string>();
      this.jobs = [];

      for (const job of [...running, ...recent]) {
        if (!seen.has(job.id)) {
          seen.add(job.id);
          this.jobs.push(job);
        }
      }

      this._onDidChangeTreeData.fire(undefined);
    } catch {
      // silently fail — will retry on next poll
    }
  }

  getTreeItem(element: JobTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: JobTreeItem): Thenable<JobTreeItem[]> {
    if (!element) {
      return Promise.resolve(this.jobs.map(j => new JobTreeItem(j)));
    }
    return Promise.resolve([]);
  }
}
