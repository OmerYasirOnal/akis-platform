import { useEffect, useRef } from 'react';
import { EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';

function getLanguageExtension(filename: string): Extension {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      return javascript({ jsx: true, typescript: ext === 'ts' || ext === 'tsx' });
    case 'py':
      return python();
    case 'html':
      return html();
    case 'css':
    case 'scss':
      return css();
    case 'json':
      return json();
    case 'md':
      return markdown();
    default:
      return [];
  }
}

const akisTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    backgroundColor: 'var(--ak-bg, #0d1117)',
  },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': { caretColor: 'var(--ak-primary, #07D1AF)' },
  '.cm-gutters': {
    backgroundColor: 'var(--ak-bg, #0d1117)',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    color: 'rgba(255,255,255,0.25)',
  },
  '.cm-lineNumbers .cm-gutterElement': { padding: '0 12px 0 8px' },
  '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.03)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(255,255,255,0.05)' },
  '.cm-selectionBackground': { backgroundColor: 'rgba(7,209,175,0.2) !important' },
});

interface CodeEditorProps {
  content: string;
  filename: string;
  readonly?: boolean;
}

export function CodeEditor({ content, filename, readonly = true }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: content,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        getLanguageExtension(filename),
        EditorState.readOnly.of(readonly),
        akisTheme,
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only recreate on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!viewRef.current) return;
    const view = viewRef.current;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: content },
    });
  }, [content, filename]);

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', overflow: 'hidden' }}
    />
  );
}
