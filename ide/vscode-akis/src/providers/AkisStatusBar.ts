import * as vscode from 'vscode';
import { AkisApiClient } from '../services/AkisApiClient.js';

export class AkisStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private refreshTimer?: ReturnType<typeof setInterval>;

  constructor(private apiClient: AkisApiClient) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100,
    );
    this.statusBarItem.command = 'akis.openChat';
    this.statusBarItem.tooltip = 'AKIS Platform — Click to open agent chat';
    this.update();
    this.statusBarItem.show();
  }

  startPolling(intervalMs = 15000): void {
    this.update();
    this.refreshTimer = setInterval(() => this.update(), intervalMs);
  }

  stopPolling(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }

  private async update(): Promise<void> {
    try {
      const running = await this.apiClient.getRunningJobs().catch(() => []);
      if (running.length > 0) {
        this.statusBarItem.text = `$(sync~spin) AKIS: ${running.length} job running`;
        this.statusBarItem.backgroundColor = undefined;
      } else {
        this.statusBarItem.text = '$(hubot) AKIS';
        this.statusBarItem.backgroundColor = undefined;
      }
    } catch {
      this.statusBarItem.text = '$(warning) AKIS: offline';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground',
      );
    }
  }

  dispose(): void {
    this.stopPolling();
    this.statusBarItem.dispose();
  }
}
