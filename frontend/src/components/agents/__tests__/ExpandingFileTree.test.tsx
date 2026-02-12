import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExpandingFileTree } from '../ExpandingFileTree';
import type { ArtifactStreamEvent, TraceStreamEvent } from '../../../services/api/types';

const translations: Record<string, string> = {
  'agentCanvas.fileTree.counts': '{read} files read, {generated} files generated',
  'agentCanvas.fileTree.emptyRunning': 'Awaiting file activity...',
  'agentCanvas.fileTree.emptyIdle': 'No files to display yet.',
  'agentCanvas.fileTree.metaWords': '{count} words',
};

vi.mock('../../../i18n/useI18n', () => ({
  useI18n: () => ({ t: (key: string) => translations[key] ?? key }),
}));

describe('ExpandingFileTree', () => {
  it('renders files from artifact events', async () => {
    const artifactEvents: ArtifactStreamEvent[] = [
      {
        type: 'artifact',
        eventId: 1,
        ts: '2026-02-12T10:00:00.000Z',
        jobId: 'job-1',
        kind: 'file',
        label: 'tasks.ts',
        path: 'src/api/tasks.ts',
        operation: 'create',
        preview: 'export const task = true;',
      },
    ];

    render(<ExpandingFileTree artifactEvents={artifactEvents} traceEvents={[]} isRunning={true} />);

    expect(await screen.findByTestId('file-src/api/tasks.ts')).toBeInTheDocument();
    expect(screen.getByText('0 files read, 1 files generated')).toBeInTheDocument();
  });

  it('groups files by directory', async () => {
    const artifactEvents: ArtifactStreamEvent[] = [
      {
        type: 'artifact',
        eventId: 2,
        ts: '2026-02-12T10:00:00.000Z',
        jobId: 'job-1',
        kind: 'file',
        label: 'a.ts',
        path: 'src/core/a.ts',
        operation: 'create',
      },
      {
        type: 'artifact',
        eventId: 3,
        ts: '2026-02-12T10:00:01.000Z',
        jobId: 'job-1',
        kind: 'file',
        label: 'b.ts',
        path: 'src/core/b.ts',
        operation: 'create',
      },
      {
        type: 'artifact',
        eventId: 4,
        ts: '2026-02-12T10:00:02.000Z',
        jobId: 'job-1',
        kind: 'file',
        label: 'c.ts',
        path: 'src/ui/c.ts',
        operation: 'create',
      },
    ];

    const traceEvents: TraceStreamEvent[] = [
      {
        type: 'trace',
        eventId: 5,
        ts: '2026-02-12T10:00:03.000Z',
        jobId: 'job-1',
        eventType: 'doc_read',
        title: 'README.md',
      },
    ];

    render(<ExpandingFileTree artifactEvents={artifactEvents} traceEvents={traceEvents} isRunning={false} />);

    expect(await screen.findByTestId('directory-src/core')).toBeInTheDocument();
    expect(screen.getByTestId('directory-src/ui')).toBeInTheDocument();
    expect(screen.getByTestId('directory-.')).toBeInTheDocument();
  });
});
