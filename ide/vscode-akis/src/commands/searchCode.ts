import * as vscode from 'vscode';
import { FileIndexer } from '../services/FileIndexer.js';

export async function searchCode(indexer: FileIndexer): Promise<void> {
  const query = await vscode.window.showInputBox({
    placeHolder: 'Search code symbols and content...',
    prompt: 'AKIS Code Search',
  });

  if (!query) {
    return;
  }

  const results = indexer.search(query);

  if (results.length === 0) {
    vscode.window.showInformationMessage(`AKIS: No results for "${query}"`);
    return;
  }

  const selected = await vscode.window.showQuickPick(
    results.map(r => ({
      label: r.symbol || r.file,
      description: r.file,
      detail: `Line ${r.line} — ${r.type}`,
      data: r,
    })),
    { placeHolder: `${results.length} results for "${query}"` },
  );

  if (selected) {
    const doc = await vscode.workspace.openTextDocument(selected.data.file);
    const editor = await vscode.window.showTextDocument(doc);
    const pos = new vscode.Position(selected.data.line - 1, 0);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
  }
}
