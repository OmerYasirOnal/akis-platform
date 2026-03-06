import { useState } from 'react';

interface FileEntry {
  filePath: string;
  content: string;
  linesOfCode: number;
}

interface Props {
  files: FileEntry[];
}

export function FileExplorer({ files }: Props) {
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);

  const tree = buildTree(files);

  return (
    <div className="rounded-2xl border border-ak-border bg-ak-surface-2 overflow-hidden">
      <div className="px-5 py-3 border-b border-ak-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-ak-text-primary">Proje Dosyaları</h3>
        <span className="text-xs text-ak-text-secondary">{files.length} dosya</span>
      </div>

      <div className="flex divide-x divide-ak-border" style={{ minHeight: 300 }}>
        {/* File Tree */}
        <div className="w-64 flex-shrink-0 overflow-auto p-3">
          <TreeNode node={tree} depth={0} selectedPath={selectedFile?.filePath} onSelect={setSelectedFile} files={files} />
        </div>

        {/* File Content */}
        <div className="flex-1 overflow-auto">
          {selectedFile ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-ak-text-secondary font-mono">{selectedFile.filePath}</span>
                <span className="text-xs text-ak-text-secondary">{selectedFile.linesOfCode} satır</span>
              </div>
              <pre className="text-xs text-ak-text-primary font-mono bg-ak-surface rounded-xl p-4 border border-ak-border overflow-auto whitespace-pre">
                {selectedFile.content}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-ak-text-secondary">
              Dosya seçin
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tree Building ────────────────────────────────

interface TreeNodeData {
  name: string;
  children: Map<string, TreeNodeData>;
  isFile: boolean;
  fullPath?: string;
}

function buildTree(files: FileEntry[]): TreeNodeData {
  const root: TreeNodeData = { name: '', children: new Map(), isFile: false };
  for (const file of files) {
    const parts = file.filePath.split('/');
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          children: new Map(),
          isFile: i === parts.length - 1,
          fullPath: i === parts.length - 1 ? file.filePath : undefined,
        });
      }
      current = current.children.get(part)!;
    }
  }
  return root;
}

function TreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
  files,
}: {
  node: TreeNodeData;
  depth: number;
  selectedPath?: string;
  onSelect: (file: FileEntry) => void;
  files: FileEntry[];
}) {
  const [open, setOpen] = useState(depth < 2);
  const sorted = [...node.children.values()].sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div>
      {sorted.map((child) => {
        if (child.isFile) {
          const file = files.find((f) => f.filePath === child.fullPath);
          return (
            <button
              key={child.name}
              onClick={() => file && onSelect(file)}
              className={`
                w-full text-left px-2 py-1 text-xs font-mono rounded transition-colors
                ${selectedPath === child.fullPath ? 'bg-ak-primary/10 text-ak-primary' : 'text-ak-text-secondary hover:text-ak-text-primary hover:bg-ak-surface'}
              `}
              style={{ paddingLeft: depth * 16 + 8 }}
            >
              {child.name}
            </button>
          );
        }

        return (
          <div key={child.name}>
            <button
              onClick={() => setOpen(!open)}
              className="w-full text-left px-2 py-1 text-xs font-mono text-ak-text-primary hover:bg-ak-surface rounded transition-colors"
              style={{ paddingLeft: depth * 16 + 8 }}
            >
              <span className="text-ak-text-secondary mr-1">{open ? '▾' : '▸'}</span>
              {child.name}/
            </button>
            {open && (
              <TreeNode node={child} depth={depth + 1} selectedPath={selectedPath} onSelect={onSelect} files={files} />
            )}
          </div>
        );
      })}
    </div>
  );
}
