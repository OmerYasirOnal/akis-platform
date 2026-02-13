import { useState, useRef, type KeyboardEvent } from 'react';
import { cn } from '../../utils/cn';
import type { PiriContextEntry } from '../../hooks/usePiriContext';

interface PiriContextSidebarProps {
  open: boolean;
  onToggle: () => void;
  entries: PiriContextEntry[];
  isLoading: boolean;
  error: string | null;
  isHealthy: boolean | null;
  onAsk: (question: string) => Promise<void>;
  onSearch: (query: string) => Promise<void>;
  onToggleEntry: (id: string) => void;
  onRemoveEntry: (id: string) => void;
  onClear: () => void;
  selectedCount: number;
}

type SearchMode = 'ask' | 'search';

export default function PiriContextSidebar({
  open,
  onToggle,
  entries,
  isLoading,
  error,
  isHealthy,
  onAsk,
  onSearch,
  onToggleEntry,
  onRemoveEntry,
  onClear,
  selectedCount,
}: PiriContextSidebarProps) {
  const [mode, setMode] = useState<SearchMode>('ask');
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    if (mode === 'ask') {
      await onAsk(trimmed);
    } else {
      await onSearch(trimmed);
    }
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  return (
    <>
      {/* Toggle button (always visible) */}
      <button
        onClick={onToggle}
        className={cn(
          'fixed right-0 top-1/2 z-40 -translate-y-1/2 rounded-l-lg border border-r-0 border-ak-border px-1.5 py-3 transition-all',
          open
            ? 'bg-ak-primary/10 text-ak-primary'
            : 'bg-ak-surface text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary'
        )}
        title={open ? 'Close Piri Context' : 'Open Piri Context'}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      </button>

      {/* Sidebar panel */}
      <div
        className={cn(
          'fixed right-0 top-12 z-30 flex h-[calc(100vh-3rem)] w-80 flex-col border-l border-ak-border bg-ak-surface transition-transform duration-200',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ak-border px-3 py-2">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-ak-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-sm font-semibold text-ak-text-primary">Piri Context</span>
            <span className={cn(
              'h-2 w-2 rounded-full',
              isHealthy === null ? 'bg-yellow-400' : isHealthy ? 'bg-emerald-400' : 'bg-red-400'
            )} />
          </div>
          {selectedCount > 0 && (
            <span className="rounded-full bg-ak-primary/10 px-2 py-0.5 text-[10px] font-medium text-ak-primary">
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-ak-border">
          <button
            onClick={() => setMode('ask')}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-colors',
              mode === 'ask'
                ? 'border-b-2 border-ak-primary text-ak-primary'
                : 'text-ak-text-secondary hover:text-ak-text-primary'
            )}
          >
            Ask Piri
          </button>
          <button
            onClick={() => setMode('search')}
            className={cn(
              'flex-1 py-2 text-xs font-medium transition-colors',
              mode === 'search'
                ? 'border-b-2 border-ak-primary text-ak-primary'
                : 'text-ak-text-secondary hover:text-ak-text-primary'
            )}
          >
            Search
          </button>
        </div>

        {/* Input area */}
        <div className="border-b border-ak-border p-3">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === 'ask' ? 'Ask a question...' : 'Search knowledge base...'}
              className="flex-1 rounded-lg border border-ak-border bg-ak-bg px-3 py-1.5 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:border-ak-primary focus:outline-none"
              disabled={isLoading || isHealthy === false}
            />
            <button
              onClick={() => void handleSubmit()}
              disabled={!input.trim() || isLoading || isHealthy === false}
              className="rounded-lg bg-ak-primary px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-ak-primary/90 disabled:opacity-40"
            >
              {isLoading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </div>
          {error && (
            <p className="mt-1.5 text-xs text-red-400">{error}</p>
          )}
          {isHealthy === false && (
            <p className="mt-1.5 text-xs text-yellow-400">Piri is not reachable</p>
          )}
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <svg className="mb-2 h-8 w-8 text-ak-text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-xs text-ak-text-secondary">
                Ask Piri a question or search for context to use with your agent.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-ak-border">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={cn(
                    'p-3 transition-colors',
                    entry.selected ? 'bg-ak-primary/5' : 'bg-transparent'
                  )}
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <button
                      onClick={() => onToggleEntry(entry.id)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      <div className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
                        entry.selected
                          ? 'border-ak-primary bg-ak-primary text-white'
                          : 'border-ak-border bg-ak-bg'
                      )}>
                        {entry.selected && (
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ak-text-primary truncate">
                        {entry.question}
                      </p>
                      <span className="text-[10px] text-ak-text-secondary">
                        {entry.type === 'query' ? 'Q&A' : 'Search'} · {entry.sources.length} sources
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveEntry(entry.id)}
                      className="flex-shrink-0 text-ak-text-secondary/50 hover:text-red-400 transition-colors"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {entry.answer && (
                    <p className="ml-6 text-xs text-ak-text-secondary line-clamp-3">
                      {entry.answer}
                    </p>
                  )}
                  {entry.sources.length > 0 && (
                    <div className="ml-6 mt-1 flex flex-wrap gap-1">
                      {entry.sources.slice(0, 3).map((s, i) => (
                        <span
                          key={i}
                          className="inline-block rounded bg-ak-surface-2 px-1.5 py-0.5 text-[10px] text-ak-text-secondary truncate max-w-[120px]"
                          title={s.source}
                        >
                          {s.source}
                        </span>
                      ))}
                      {entry.sources.length > 3 && (
                        <span className="text-[10px] text-ak-text-secondary/50">
                          +{entry.sources.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {entries.length > 0 && (
          <div className="border-t border-ak-border p-2 flex items-center justify-between">
            <button
              onClick={onClear}
              className="text-[10px] text-ak-text-secondary hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
            <span className="text-[10px] text-ak-text-secondary">
              {selectedCount}/{entries.length} will be injected
            </span>
          </div>
        )}
      </div>
    </>
  );
}
