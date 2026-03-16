import { useState } from 'react';
import type { Workflow, FileTreeNode } from '../../types/workflow';

// ═══ File Icon Map ═══
function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'tsx': case 'jsx': return '⚛';
    case 'ts': return '◇';
    case 'js': return '◆';
    case 'spec.ts': case 'spec.tsx': case 'test.ts': case 'test.tsx': return '🧪';
    case 'json': return '{}';
    case 'css': case 'scss': return '🎨';
    case 'md': return '📝';
    case 'html': return '🌐';
    default: return '📄';
  }
}

function isTestFile(name: string): boolean {
  return name.includes('.spec.') || name.includes('.test.') || name.includes('__tests__');
}

// ═══ Build tree from flat file paths ═══
function buildFileTree(
  protoFiles: Array<{ filePath: string; linesOfCode: number }>,
  traceFiles: Array<{ filePath: string; testCount: number }>,
): FileTreeNode {
  const root: FileTreeNode = { name: '', type: 'folder', children: [] };

  const insertPath = (filePath: string, lines: number, agent: 'proto' | 'trace') => {
    const parts = filePath.split('/').filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        current.children = current.children || [];
        current.children.push({
          name: part,
          type: 'file',
          path: filePath,
          lines,
          agent,
          status: agent === 'trace' ? 'test' : 'new',
        });
      } else {
        current.children = current.children || [];
        let folder = current.children.find(c => c.type === 'folder' && c.name === part);
        if (!folder) {
          folder = { name: part, type: 'folder', children: [] };
          current.children.push(folder);
        }
        current = folder;
      }
    }
  };

  for (const f of protoFiles) {
    insertPath(f.filePath, f.linesOfCode, 'proto');
  }
  for (const f of traceFiles) {
    insertPath(f.filePath, f.testCount, 'trace');
  }

  // Sort: folders first, then files
  const sortTree = (node: FileTreeNode) => {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortTree);
    }
  };
  sortTree(root);

  return root;
}

// ═══ Sub-Components ═══

function TreeNode({
  node,
  depth,
  onFileSelect,
  selectedFile,
  githubBaseUrl,
}: {
  node: FileTreeNode;
  depth: number;
  onFileSelect?: (filePath: string) => void;
  selectedFile?: string | null;
  githubBaseUrl?: string | null;
}) {
  const [open, setOpen] = useState(depth < 3);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-1.5 py-0.5 text-left text-sm hover:bg-ak-hover transition-colors rounded px-1"
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
        >
          <svg
            className={`h-3 w-3 flex-shrink-0 text-ak-text-tertiary transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-ak-text-secondary">{node.name}/</span>
        </button>
        {open && node.children?.map((child, i) => (
          <TreeNode key={child.name + i} node={child} depth={depth + 1} onFileSelect={onFileSelect} selectedFile={selectedFile} githubBaseUrl={githubBaseUrl} />
        ))}
      </div>
    );
  }

  // File node
  const icon = isTestFile(node.name) ? '🧪' : getFileIcon(node.name);
  const agentColor = node.agent === 'trace' ? 'text-ak-trace' : 'text-ak-proto';
  const agentLabel = node.agent === 'trace' ? 'TRACE' : 'PROTO';
  const isSelected = selectedFile === node.path;

  return (
    <button
      onClick={() => onFileSelect?.(node.path || node.name)}
      className={`flex w-full items-center gap-1.5 py-0.5 text-left text-sm rounded px-1 transition-colors ${
        isSelected
          ? 'bg-ak-primary/10 text-ak-primary'
          : 'hover:bg-ak-hover'
      }`}
      style={{ paddingLeft: `${depth * 12 + 4}px` }}
    >
      <span className="flex-shrink-0 text-xs">{icon}</span>
      <span className={`flex-1 truncate font-mono text-xs ${isSelected ? 'text-ak-primary' : 'text-ak-text-primary'}`}>{node.name}</span>
      <span className={`flex-shrink-0 text-[9px] font-bold ${agentColor}`}>{agentLabel}</span>
      {node.lines != null && node.lines > 0 && (
        <span className="flex-shrink-0 text-[10px] text-ak-text-tertiary font-mono">{node.lines}L</span>
      )}
      {githubBaseUrl && node.path && (
        <a
          href={`${githubBaseUrl}/${node.path}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 text-ak-text-tertiary/50 transition-colors hover:text-ak-text-primary"
          title="View on GitHub"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        </a>
      )}
    </button>
  );
}

// ═══ Main Component ═══

interface FileManagerProps {
  workflow: Workflow;
  onFileSelect?: (filePath: string) => void;
  selectedFile?: string | null;
}

export function FileManager({ workflow, onFileSelect, selectedFile }: FileManagerProps) {

  // Get proto result from conversation for richer data (includes real line counts)
  const protoMsg = workflow.conversation?.find(m => m.type === 'proto_result');
  const protoResultFiles = protoMsg?.protoResult?.files || [];

  // Use conversation data (has real line counts) or fall back to stage data
  const protoFiles = protoResultFiles.length > 0
    ? protoResultFiles.map(f => ({ filePath: f.path || f.name, linesOfCode: f.lines || 0 }))
    : (workflow.stages.proto.files || []).map(f => ({ filePath: f, linesOfCode: 0 }));

  // Get trace file data from conversation
  const traceMsg = workflow.conversation?.find(m => m.type === 'trace_result');
  const traceFiles = traceMsg?.traceResult?.testFiles?.map(f => ({ filePath: f.path || f.name, testCount: f.lines || 0 })) || [];

  const hasFiles = protoFiles.length > 0 || traceFiles.length > 0;
  const tree = hasFiles ? buildFileTree(protoFiles, traceFiles) : null;
  const totalFiles = protoFiles.length + traceFiles.length;
  const totalLines = protoMsg?.protoResult?.totalLines || 0;
  const branch = workflow.stages.proto.branch || protoMsg?.protoResult?.branch;
  const repoName = protoMsg?.protoResult?.repo;

  // Build GitHub base URL
  const githubBaseUrl = repoName && branch
    ? `https://github.com/${repoName}/blob/${branch}`
    : null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-ak-surface">
      {/* Stats bar */}
      {hasFiles && (
        <div className="border-b border-ak-border px-3 py-2 text-[11px] text-ak-text-tertiary">
          <span className="font-medium text-ak-text-secondary">{totalFiles}</span> Files
          {totalLines > 0 && (
            <>
              {' · '}
              <span className="font-medium text-ak-text-secondary">{totalLines}</span> Lines
            </>
          )}
          {traceFiles.length > 0 && (
            <>
              {' · '}
              <span className="font-medium text-ak-text-secondary">{traceFiles.length}</span> Tests
            </>
          )}
        </div>
      )}

      {/* Branch info with GitHub link */}
      {branch && (
        <div className="flex items-center gap-2 border-b border-ak-border px-3 py-2">
          <code className="rounded bg-ak-surface-2 px-2 py-0.5 font-mono text-[11px] text-ak-proto">
            ⑂ {branch}
          </code>
          {githubBaseUrl && (
            <a
              href={`https://github.com/${repoName}/tree/${branch}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-ak-text-tertiary transition-colors hover:text-ak-text-primary"
              title="View on GitHub"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          )}
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {!hasFiles && (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <p className="text-xs text-ak-text-tertiary">
              Dosya bilgisi henüz mevcut değil. Proto veya Trace tamamlandığında dosya ağacı burada görünecek.
            </p>
          </div>
        )}
        {tree?.children?.map((child, i) => (
          <TreeNode key={child.name + i} node={child} depth={0} onFileSelect={onFileSelect} selectedFile={selectedFile} githubBaseUrl={githubBaseUrl} />
        ))}
      </div>

      {/* Legend */}
      {hasFiles && (
        <div className="border-t border-ak-border px-3 py-2 flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-ak-proto" /> Proto
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-ak-trace" /> Trace
          </span>
        </div>
      )}
    </div>
  );
}
