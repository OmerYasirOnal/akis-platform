import * as vscode from 'vscode';
import * as path from 'path';
import { FileIndexer, IndexEntry } from '../services/FileIndexer.js';

class IndexGroupItem extends vscode.TreeItem {
  constructor(
    public readonly groupType: string,
    public readonly count: number,
  ) {
    super(
      `${IndexGroupItem.labelFor(groupType)} (${count})`,
      vscode.TreeItemCollapsibleState.Collapsed,
    );
    this.iconPath = new vscode.ThemeIcon(IndexGroupItem.iconFor(groupType));
    this.contextValue = 'indexGroup';
  }

  static labelFor(type: string): string {
    switch (type) {
      case 'function': return 'Functions';
      case 'class': return 'Classes';
      case 'interface': return 'Interfaces';
      case 'type': return 'Types';
      case 'variable': return 'Variables';
      case 'import': return 'Imports';
      default: return type;
    }
  }

  static iconFor(type: string): string {
    switch (type) {
      case 'function': return 'symbol-method';
      case 'class': return 'symbol-class';
      case 'interface': return 'symbol-interface';
      case 'type': return 'symbol-type-parameter';
      case 'variable': return 'symbol-variable';
      case 'import': return 'package';
      default: return 'symbol-misc';
    }
  }
}

class IndexEntryItem extends vscode.TreeItem {
  constructor(public readonly entry: IndexEntry) {
    super(entry.symbol, vscode.TreeItemCollapsibleState.None);
    this.description = `${path.basename(entry.file)}:${entry.line}`;
    this.tooltip = `${entry.file}:${entry.line}`;
    this.iconPath = new vscode.ThemeIcon(IndexGroupItem.iconFor(entry.type));
    this.contextValue = 'indexEntry';

    this.command = {
      command: 'vscode.open',
      title: 'Open File',
      arguments: [
        vscode.Uri.file(entry.file),
        {
          selection: new vscode.Range(
            new vscode.Position(entry.line - 1, 0),
            new vscode.Position(entry.line - 1, 0),
          ),
        },
      ],
    };
  }
}

type TreeItem = IndexGroupItem | IndexEntryItem;

export class IndexedFilesProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private groups = new Map<string, IndexEntry[]>();

  constructor(private indexer: FileIndexer) {}

  refresh(): void {
    this.buildGroups();
    this._onDidChangeTreeData.fire(undefined);
  }

  private buildGroups(): void {
    this.groups.clear();
    const allEntries = this.indexer.entries;
    if (!allEntries || allEntries.length === 0) { return; }

    for (const entry of allEntries) {
      if (entry.type === 'import') { continue; } // skip imports for cleaner view
      const group = this.groups.get(entry.type) || [];
      group.push(entry);
      this.groups.set(entry.type, group);
    }
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TreeItem): Thenable<TreeItem[]> {
    if (!element) {
      // Root: show groups
      this.buildGroups();
      const items: IndexGroupItem[] = [];
      const order = ['function', 'class', 'interface', 'type', 'variable'];
      for (const type of order) {
        const entries = this.groups.get(type);
        if (entries && entries.length > 0) {
          items.push(new IndexGroupItem(type, entries.length));
        }
      }

      if (items.length === 0) {
        return Promise.resolve([
          new vscode.TreeItem('No index. Run "AKIS: Index Workspace"') as TreeItem,
        ]);
      }

      return Promise.resolve(items);
    }

    if (element instanceof IndexGroupItem) {
      const entries = this.groups.get(element.groupType) || [];
      return Promise.resolve(
        entries
          .sort((a, b) => a.symbol.localeCompare(b.symbol))
          .slice(0, 200) // limit for performance
          .map(e => new IndexEntryItem(e)),
      );
    }

    return Promise.resolve([]);
  }
}
