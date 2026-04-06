import { useState } from 'react';

interface FileTreePanelProps {
  files: Array<{ path: string; content: string }>;
  activeFile: string | null;
  onFileSelect: (path: string, content: string) => void;
}

function FileItem({
  name,
  fullPath,
  depth,
  isDir,
  activeFile,
  onFileSelect,
  allFiles,
}: {
  name: string;
  fullPath: string;
  depth: number;
  isDir: boolean;
  activeFile: string | null;
  onFileSelect: (path: string, content: string) => void;
  allFiles: Array<{ path: string; content: string }>;
}) {
  const [open, setOpen] = useState(depth < 2);
  const indent = depth * 16;

  if (isDir) {
    const prefix = fullPath + '/';
    const childNames = allFiles
      .filter((f) => f.path.startsWith(prefix))
      .map((f) => f.path.slice(prefix.length).split('/')[0])
      .filter((v, i, a) => a.indexOf(v) === i);

    return (
      <div>
        <div
          className="flex items-center gap-1 px-2 py-0.5 cursor-pointer hover:bg-white/5 text-xs"
          style={{ paddingLeft: `${8 + indent}px` }}
          onClick={() => setOpen(!open)}
        >
          <span className="opacity-40 text-[10px]">{open ? '\u25BE' : '\u25B8'}</span>
          <span className="opacity-70">{name}</span>
        </div>
        {open &&
          childNames.map((childName) => {
            const childPath = `${fullPath}/${childName}`;
            const childIsDir = allFiles.some((f) =>
              f.path.startsWith(childPath + '/'),
            );
            return (
              <FileItem
                key={childPath}
                name={childName}
                fullPath={childPath}
                depth={depth + 1}
                isDir={childIsDir}
                activeFile={activeFile}
                onFileSelect={onFileSelect}
                allFiles={allFiles}
              />
            );
          })}
      </div>
    );
  }

  const isActive = activeFile === fullPath;
  const ext = fullPath.split('.').pop() || '';
  const icons: Record<string, string> = {
    ts: 'TS',
    tsx: 'TX',
    js: 'JS',
    jsx: 'JX',
    json: '{}',
    md: 'MD',
    css: 'CS',
    html: '<>',
    py: 'PY',
    sh: '$_',
  };
  const icon = icons[ext] || '..';
  const file = allFiles.find((f) => f.path === fullPath);

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-0.5 cursor-pointer text-xs transition-colors ${
        isActive
          ? 'bg-white/10 text-white'
          : 'hover:bg-white/5 text-white/60 hover:text-white/80'
      }`}
      style={{ paddingLeft: `${8 + indent}px` }}
      onClick={() => file && onFileSelect(file.path, file.content)}
    >
      <span className="text-[9px] font-mono opacity-50 w-4 text-center">{icon}</span>
      <span className="truncate">{name}</span>
    </div>
  );
}

export function FileTreePanel({ files, activeFile, onFileSelect }: FileTreePanelProps) {
  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full opacity-30 text-xs">
        Proto tamamlandiginda dosyalar burada gorunur
      </div>
    );
  }

  // Normalize paths and build top-level entries
  const normalized = files.map((f) => ({
    ...f,
    path: f.path.replace(/^\.?\//, ''),
  }));

  const topLevelNames = normalized
    .map((f) => f.path.split('/')[0])
    .filter((v, i, a) => a.indexOf(v) === i);

  return (
    <div
      className="h-full overflow-y-auto py-2"
      style={{ backgroundColor: 'var(--ak-bg, #0d1117)' }}
    >
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest opacity-30 font-medium">
        Dosyalar
      </div>
      {topLevelNames.map((name) => {
        const isDir = normalized.some((f) => f.path.startsWith(name + '/'));
        return (
          <FileItem
            key={name}
            name={name}
            fullPath={name}
            depth={0}
            isDir={isDir}
            activeFile={activeFile}
            onFileSelect={onFileSelect}
            allFiles={normalized}
          />
        );
      })}
    </div>
  );
}
