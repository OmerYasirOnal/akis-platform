import * as vscode from 'vscode';
import { FileIndexer, IndexStats } from '../services/FileIndexer.js';

export async function indexWorkspace(indexer: FileIndexer): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showWarningMessage('AKIS: No workspace folder open');
    return;
  }

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'AKIS: Indexing workspace...',
      cancellable: true,
    },
    async (progress, token) => {
      const rootPath = folders[0].uri.fsPath;

      progress.report({ message: 'Scanning files...' });

      const stats = await indexer.indexDirectory(rootPath, (file, total) => {
        if (token.isCancellationRequested) {
          return;
        }
        progress.report({
          message: `${file} (${total} files)`,
          increment: 1,
        });
      });

      showIndexResults(stats);
    },
  );
}

function showIndexResults(stats: IndexStats): void {
  const msg = [
    `Indexed ${stats.totalFiles} files`,
    `${stats.functions} functions`,
    `${stats.classes} classes`,
    `${stats.imports} imports`,
    `in ${(stats.durationMs / 1000).toFixed(1)}s`,
  ].join(' | ');

  vscode.window.showInformationMessage(`AKIS: ${msg}`);
}
