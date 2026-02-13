import * as vscode from 'vscode';
import { FileIndexer } from '../services/FileIndexer.js';
import { CodeSearchService } from '../services/CodeSearchService.js';

interface SearchItem extends vscode.QuickPickItem {
  filePath: string;
  lineNumber: number;
}

export async function searchCode(
  indexer: FileIndexer,
  codeSearch?: CodeSearchService,
): Promise<void> {
  const query = await vscode.window.showInputBox({
    placeHolder: 'Search code symbols and content...',
    prompt: 'AKIS Code Search — searches indexed symbols + ripgrep content',
  });

  if (!query) {
    return;
  }

  const items: SearchItem[] = [];

  // 1) Index-based symbol search
  const indexResults = indexer.search(query);
  for (const r of indexResults.slice(0, 50)) {
    items.push({
      label: `$(symbol-${getIconName(r.type)}) ${r.symbol}`,
      description: r.file.replace(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath + '/', ''),
      detail: `Line ${r.line} — ${r.type}`,
      filePath: r.file,
      lineNumber: r.line,
    });
  }

  // 2) Ripgrep-based content search (when available)
  if (codeSearch?.isAvailable && vscode.workspace.workspaceFolders?.[0]) {
    const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    const rgResults = await codeSearch.search(query, rootPath, {
      maxResults: 50,
      fileGlob: '!node_modules',
    });

    for (const r of rgResults) {
      // Avoid duplicates from index
      const alreadyExists = items.some(
        i => i.filePath === r.file && i.lineNumber === r.line,
      );
      if (alreadyExists) { continue; }

      items.push({
        label: `$(search) ${r.text.substring(0, 80)}`,
        description: r.file.replace(rootPath + '/', ''),
        detail: `Line ${r.line}`,
        filePath: r.file,
        lineNumber: r.line,
      });
    }
  }

  if (items.length === 0) {
    vscode.window.showInformationMessage(`AKIS: No results for "${query}"`);
    return;
  }

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: `${items.length} results for "${query}"`,
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (selected) {
    const doc = await vscode.workspace.openTextDocument(selected.filePath);
    const editor = await vscode.window.showTextDocument(doc);
    const pos = new vscode.Position(selected.lineNumber - 1, 0);
    editor.selection = new vscode.Selection(pos, pos);
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
  }
}

function getIconName(type: string): string {
  switch (type) {
    case 'function': return 'method';
    case 'class': return 'class';
    case 'interface': return 'interface';
    case 'type': return 'type-parameter';
    case 'variable': return 'variable';
    case 'import': return 'package';
    default: return 'misc';
  }
}
