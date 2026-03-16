import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  DockviewReact,
  type DockviewReadyEvent,
  type IDockviewPanelProps,
  type DockviewApi,
} from 'dockview';
import 'dockview/dist/styles/dockview.css';
import { CodeEditor } from './CodeEditor';
import { FileTreePanel } from './FileTreePanel';

interface IDELayoutProps {
  files: Array<{ path: string; content: string }>;
  pipelinePanel: ReactNode;
}

// Panel component registry — each panel type gets a wrapper
const FileTreePanelWrapper = (
  props: IDockviewPanelProps<{
    files: Array<{ path: string; content: string }>;
    active: string | null;
    onSelect: (path: string, content: string) => void;
  }>,
) => (
  <FileTreePanel
    files={props.params.files}
    activeFile={props.params.active}
    onFileSelect={props.params.onSelect}
  />
);

const EditorPanelWrapper = (
  props: IDockviewPanelProps<{ content: string; filename: string }>,
) => (
  <div style={{ height: '100%', backgroundColor: 'var(--ak-bg, #0d1117)' }}>
    {props.params.content ? (
      <CodeEditor content={props.params.content} filename={props.params.filename} readonly />
    ) : (
      <div className="flex items-center justify-center h-full opacity-20 text-sm">
        Dosya secin
      </div>
    )}
  </div>
);

const PipelinePanelWrapper = (
  props: IDockviewPanelProps<{ children: ReactNode }>,
) => (
  <div
    style={{
      height: '100%',
      overflowY: 'auto',
      backgroundColor: 'var(--ak-surface, #111827)',
      padding: '12px',
    }}
  >
    {props.params.children}
  </div>
);

const components = {
  fileTree: FileTreePanelWrapper,
  editor: EditorPanelWrapper,
  pipeline: PipelinePanelWrapper,
};

export function IDELayout({ files, pipelinePanel }: IDELayoutProps) {
  const apiRef = useRef<DockviewApi | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState('');

  const handleFileSelect = useCallback((path: string, content: string) => {
    setActiveFile(path);
    setActiveContent(content);
    const api = apiRef.current;
    if (!api) return;
    const ep = api.getPanel('editor');
    if (ep) {
      ep.api.updateParameters({ content, filename: path });
      ep.api.setTitle(path.split('/').pop() ?? path);
    }
  }, []);

  function onReady(event: DockviewReadyEvent) {
    const api = event.api;
    apiRef.current = api;

    // Left: file tree
    const filePanel = api.addPanel({
      id: 'file-tree',
      component: 'fileTree',
      title: 'Dosyalar',
      params: {
        files,
        active: activeFile,
        onSelect: handleFileSelect,
      },
    });

    // Center: editor
    api.addPanel({
      id: 'editor',
      component: 'editor',
      title: 'Editor',
      position: { referencePanel: 'file-tree', direction: 'right' },
      params: { content: activeContent, filename: activeFile ?? '' },
    });

    // Right: pipeline
    const pipelineP = api.addPanel({
      id: 'pipeline',
      component: 'pipeline',
      title: 'Pipeline',
      position: { referencePanel: 'editor', direction: 'right' },
      params: { children: pipelinePanel },
    });

    // Set initial widths
    filePanel.api.setSize({ width: 220 });
    pipelineP.api.setSize({ width: 360 });
  }

  // Sync file list changes
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const p = api.getPanel('file-tree');
    p?.api.updateParameters({
      files,
      active: activeFile,
      onSelect: handleFileSelect,
    });
  }, [files, activeFile, handleFileSelect]);

  // Sync pipeline panel content
  useEffect(() => {
    const api = apiRef.current;
    if (!api) return;
    const p = api.getPanel('pipeline');
    p?.api.updateParameters({ children: pipelinePanel });
  }, [pipelinePanel]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <DockviewReact
        components={components}
        onReady={onReady}
        className="dockview-theme-dark"
      />
    </div>
  );
}
