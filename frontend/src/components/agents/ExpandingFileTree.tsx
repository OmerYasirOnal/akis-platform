import { memo, useEffect, useMemo, useState } from 'react';
import type { ArtifactStreamEvent, TraceStreamEvent } from '../../services/api/types';
import { useI18n } from '../../i18n/useI18n';
import { cn } from '../../utils/cn';

export interface ExpandingFileTreeProps {
  artifactEvents: ArtifactStreamEvent[];
  traceEvents: TraceStreamEvent[];
  isRunning: boolean;
}

type FileType = 'read' | 'generated' | 'modified';

interface FileNode {
  path: string;
  type: FileType;
  preview?: string;
  sizeBytes?: number;
}

function getFileLanguage(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  if (!extension) return 'txt';

  const map: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript',
    js: 'JavaScript',
    jsx: 'JavaScript',
    md: 'Markdown',
    json: 'JSON',
    yml: 'YAML',
    yaml: 'YAML',
    html: 'HTML',
    css: 'CSS',
  };

  return map[extension] ?? extension.toUpperCase();
}

function formatSize(sizeBytes?: number): string {
  if (!sizeBytes || sizeBytes <= 0) return '0 B';
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function countWords(value: string | undefined): number {
  if (!value) return 0;
  return value
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

function normalizePath(value: string | undefined): string {
  if (!value) return '';
  return value.trim();
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function buildFileNodes(artifactEvents: ArtifactStreamEvent[], traceEvents: TraceStreamEvent[]): FileNode[] {
  const map = new Map<string, FileNode>();

  for (const trace of traceEvents) {
    const candidatePath = normalizePath((trace.detail?.path as string | undefined) ?? trace.title);
    if (!candidatePath) continue;

    if (trace.eventType === 'doc_read') {
      map.set(candidatePath, {
        path: candidatePath,
        type: 'read',
      });
    }

    if (trace.eventType === 'file_created') {
      map.set(candidatePath, {
        path: candidatePath,
        type: 'generated',
      });
    }

    if (trace.eventType === 'file_modified') {
      map.set(candidatePath, {
        path: candidatePath,
        type: 'modified',
      });
    }
  }

  for (const artifact of artifactEvents) {
    const candidatePath = normalizePath(artifact.path ?? artifact.label);
    if (!candidatePath) continue;

    const previous = map.get(candidatePath);

    const nextType: FileType = artifact.kind === 'doc_read'
      ? 'read'
      : artifact.operation === 'modify'
        ? 'modified'
        : 'generated';

    const finalType: FileType = previous?.type === 'modified'
      ? 'modified'
      : previous?.type === 'generated' && nextType === 'read'
        ? 'generated'
        : nextType;

    map.set(candidatePath, {
      path: candidatePath,
      type: finalType,
      preview: artifact.preview ?? previous?.preview,
      sizeBytes: artifact.sizeBytes ?? previous?.sizeBytes,
    });
  }

  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function groupByDirectory(nodes: FileNode[]): Record<string, FileNode[]> {
  return nodes.reduce<Record<string, FileNode[]>>((acc, node) => {
    const slashIndex = node.path.lastIndexOf('/');
    const directory = slashIndex > 0 ? node.path.slice(0, slashIndex) : '.';
    if (!acc[directory]) {
      acc[directory] = [];
    }
    acc[directory].push(node);
    return acc;
  }, {});
}

function ExpandingFileTreeComponent({ artifactEvents, traceEvents, isRunning }: ExpandingFileTreeProps) {
  const { t: translate } = useI18n();
  const t = (key: string) => translate(key as never);

  const fileNodes = useMemo(() => buildFileNodes(artifactEvents, traceEvents), [artifactEvents, traceEvents]);
  const filesByDirectory = useMemo(() => groupByDirectory(fileNodes), [fileNodes]);
  const directories = useMemo(() => Object.keys(filesByDirectory).sort((a, b) => a.localeCompare(b)), [filesByDirectory]);

  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    setReducedMotion(mediaQuery.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      for (const directory of directories) {
        if (!next.has(directory)) {
          next.add(directory);
        }
      }
      return next;
    });
  }, [directories]);

  const readCount = fileNodes.filter((node) => node.type === 'read').length;
  const generatedCount = fileNodes.filter((node) => node.type === 'generated').length;

  const toggleDirectory = (directory: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(directory)) {
        next.delete(directory);
      } else {
        next.add(directory);
      }
      return next;
    });
  };

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <div className="rounded-lg bg-ak-surface p-4">
      <p className="mb-3 text-sm text-ak-text-secondary">
        {t('agentCanvas.fileTree.counts')
          .replace('{read}', String(readCount))
          .replace('{generated}', String(generatedCount))}
      </p>

      {directories.length === 0 && (
        <p className="text-xs text-ak-text-secondary">
          {isRunning ? t('agentCanvas.fileTree.emptyRunning') : t('agentCanvas.fileTree.emptyIdle')}
        </p>
      )}

      <div className="space-y-2">
        {directories.map((directory) => {
          const open = expandedDirs.has(directory);
          const files = filesByDirectory[directory] ?? [];

          return (
            <div key={directory} data-testid={`directory-${directory}`}>
              <button
                type="button"
                onClick={() => toggleDirectory(directory)}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs font-semibold text-ak-text-primary hover:bg-ak-surface-2"
              >
                <span aria-hidden="true">{open ? '📂' : '📁'}</span>
                <span>{directory}</span>
              </button>

              {open && (
                <div className="mt-1 space-y-1 pl-4">
                  {files.map((file) => {
                    const showPreview = expandedFiles.has(file.path) && Boolean(file.preview);
                    const fileName = file.path.split('/').pop() ?? file.path;
                    const icon = file.type === 'read' ? '📄' : file.type === 'generated' ? '✏️' : '🔄';

                    return (
                      <div
                        key={file.path}
                        className={cn(
                          'rounded border border-ak-border/70 bg-ak-surface-2 px-2 py-1',
                          !reducedMotion && 'animate-slide-in-right',
                          file.type === 'generated' && 'border-l-2 border-l-emerald-400',
                        )}
                        data-testid={`file-${file.path}`}
                      >
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 text-xs text-ak-text-secondary"
                          onClick={() => toggleFile(file.path)}
                        >
                          <span className="flex items-center gap-2 text-ak-text-primary">
                            <span aria-hidden="true">{icon}</span>
                            <span>{fileName}</span>
                          </span>

                          <span className="flex items-center gap-2 text-[10px]">
                            <span>{t('agentCanvas.fileTree.metaWords').replace('{count}', String(countWords(file.preview)))}</span>
                            <span>{getFileLanguage(file.path)}</span>
                            <span>{formatSize(file.sizeBytes)}</span>
                          </span>
                        </button>

                        {showPreview && (
                          <div className="mt-2 max-h-[200px] overflow-y-auto rounded bg-ak-surface px-3 py-2 font-mono text-xs text-ak-text-secondary">
                            {file.preview}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ExpandingFileTree = memo(ExpandingFileTreeComponent);
export default ExpandingFileTree;
