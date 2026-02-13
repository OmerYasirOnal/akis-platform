import { useState, useCallback, useRef, useEffect } from 'react';
import { ragApi, type RAGQueryResponse, type RAGSearchResponse } from '../services/api/rag';

export interface PiriContextEntry {
  id: string;
  type: 'query' | 'search';
  question: string;
  answer?: string;
  sources: Array<{ content: string; source: string; score: number }>;
  timestamp: Date;
  selected: boolean;
}

interface UsePiriContextResult {
  entries: PiriContextEntry[];
  isLoading: boolean;
  error: string | null;
  isHealthy: boolean | null;
  askPiri: (question: string) => Promise<void>;
  searchPiri: (query: string) => Promise<void>;
  toggleEntry: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  removeEntry: (id: string) => void;
  clearEntries: () => void;
  getSelectedContext: () => string;
}

export function usePiriContext(): UsePiriContextResult {
  const [entries, setEntries] = useState<PiriContextEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const idCounter = useRef(0);

  useEffect(() => {
    let cancelled = false;
    ragApi.getStatus()
      .then((s) => { if (!cancelled) setIsHealthy(s.healthy); })
      .catch(() => { if (!cancelled) setIsHealthy(false); });
    return () => { cancelled = true; };
  }, []);

  const askPiri = useCallback(async (question: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res: RAGQueryResponse = await ragApi.query({ question, top_k: 5 });
      const entry: PiriContextEntry = {
        id: `piri-${++idCounter.current}`,
        type: 'query',
        question,
        answer: res.answer,
        sources: res.sources,
        timestamp: new Date(),
        selected: true,
      };
      setEntries((prev) => [entry, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Piri query failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchPiri = useCallback(async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res: RAGSearchResponse = await ragApi.search({ query, top_k: 5 });
      const entry: PiriContextEntry = {
        id: `piri-${++idCounter.current}`,
        type: 'search',
        question: query,
        sources: res.results,
        timestamp: new Date(),
        selected: true,
      };
      setEntries((prev) => [entry, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Piri search failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleEntry = useCallback((id: string) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, selected: !e.selected } : e));
  }, []);

  const selectAll = useCallback(() => {
    setEntries((prev) => prev.map((e) => ({ ...e, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setEntries((prev) => prev.map((e) => ({ ...e, selected: false })));
  }, []);

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  const getSelectedContext = useCallback((): string => {
    const selected = entries.filter((e) => e.selected);
    if (selected.length === 0) return '';

    return selected
      .map((e) => {
        const parts: string[] = [];
        parts.push(`[Piri ${e.type === 'query' ? 'Q&A' : 'Search'}: "${e.question}"]`);
        if (e.answer) parts.push(`Answer: ${e.answer}`);
        if (e.sources.length > 0) {
          parts.push('Sources:');
          e.sources.forEach((s, i) => {
            parts.push(`  ${i + 1}. [${s.source}] ${s.content.slice(0, 200)}`);
          });
        }
        return parts.join('\n');
      })
      .join('\n\n---\n\n');
  }, [entries]);

  return {
    entries,
    isLoading,
    error,
    isHealthy,
    askPiri,
    searchPiri,
    toggleEntry,
    selectAll,
    deselectAll,
    removeEntry,
    clearEntries,
    getSelectedContext,
  };
}
