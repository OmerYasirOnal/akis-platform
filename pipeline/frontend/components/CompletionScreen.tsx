import { useState } from 'react';
import type { Pipeline } from '../types';
import { FileExplorer } from './FileExplorer';
import { CoverageMatrix } from './CoverageMatrix';

interface Props {
  pipeline: Pipeline;
  onNewPipeline: () => void;
}

type Tab = 'overview' | 'files' | 'tests' | 'spec';

export function CompletionScreen({ pipeline, onNewPipeline }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const isPartial = pipeline.stage === 'completed_partial';
  const proto = pipeline.protoOutput;
  const trace = pipeline.traceOutput;

  const tabs: { key: Tab; label: string; available: boolean }[] = [
    { key: 'overview', label: 'Özet', available: true },
    { key: 'files', label: 'Dosyalar', available: !!proto },
    { key: 'tests', label: 'Testler', available: !!trace },
    { key: 'spec', label: 'Spec', available: !!pipeline.approvedSpec },
  ];

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`rounded-2xl px-6 py-5 border ${isPartial ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-ak-primary/20 bg-ak-primary/5'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isPartial ? 'bg-yellow-500/20 text-yellow-400' : 'bg-ak-primary/20 text-ak-primary'}`}>
            {isPartial ? '!' : '✓'}
          </div>
          <h2 className="text-lg font-semibold text-ak-text-primary">
            {isPartial ? 'Pipeline Kısmen Tamamlandı' : 'Pipeline Tamamlandı'}
          </h2>
        </div>
        {isPartial && (
          <p className="text-sm text-ak-text-secondary ml-11">
            Kod başarıyla üretildi ancak test yazılamadı. Projeyi yine de kullanabilirsiniz.
          </p>
        )}
      </div>

      {/* Quick Stats */}
      {proto && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Dosya" value={proto.metadata.filesCreated.toString()} />
          <StatCard label="Satır Kod" value={proto.metadata.totalLinesOfCode.toString()} />
          <StatCard label="Stack" value={proto.metadata.stackUsed} />
          <StatCard label="Test" value={trace ? trace.testSummary.totalTests.toString() : '—'} />
        </div>
      )}

      {/* Setup Commands */}
      {proto && (
        <div className="rounded-2xl border border-ak-border bg-ak-surface-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-ak-text-primary">Kurulum</h3>
            <button
              onClick={() => navigator.clipboard.writeText(proto.setupCommands.join('\n'))}
              className="text-xs text-ak-primary hover:text-ak-primary/80 transition-colors"
            >
              Kopyala
            </button>
          </div>
          <pre className="text-xs font-mono text-ak-text-primary bg-ak-surface rounded-xl p-4 border border-ak-border overflow-auto">
            {proto.setupCommands.join('\n')}
          </pre>
        </div>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        {proto?.repoUrl && (
          <a
            href={proto.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-ak-surface-2 border border-ak-border text-ak-text-primary hover:border-ak-primary/30 transition-colors"
          >
            GitHub Repo
          </a>
        )}
        {proto?.prUrl && (
          <a
            href={proto.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-ak-surface-2 border border-ak-border text-ak-text-primary hover:border-ak-primary/30 transition-colors"
          >
            Pull Request
          </a>
        )}
        {trace?.prUrl && (
          <a
            href={trace.prUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-ak-surface-2 border border-ak-border text-ak-text-primary hover:border-ak-primary/30 transition-colors"
          >
            Test PR
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-ak-border flex gap-1">
        {tabs.filter((t) => t.available).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-ak-primary text-ak-primary'
                : 'border-transparent text-ak-text-secondary hover:text-ak-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && proto && (
        <div className="text-sm text-ak-text-secondary space-y-2">
          <p>Repo: <span className="text-ak-text-primary font-mono">{proto.repo}</span></p>
          <p>Branch: <span className="text-ak-text-primary font-mono">{proto.branch}</span></p>
          {pipeline.metrics.totalDurationMs && (
            <p>Süre: <span className="text-ak-text-primary">{Math.round(pipeline.metrics.totalDurationMs / 1000)}s</span></p>
          )}
        </div>
      )}

      {activeTab === 'files' && proto && <FileExplorer files={proto.files} />}

      {activeTab === 'tests' && trace && pipeline.approvedSpec && (
        <CoverageMatrix spec={pipeline.approvedSpec} traceOutput={trace} />
      )}

      {activeTab === 'spec' && pipeline.approvedSpec && (
        <div className="rounded-2xl border border-ak-border bg-ak-surface-2 p-5">
          <pre className="text-xs font-mono text-ak-text-primary whitespace-pre-wrap">
            {JSON.stringify(pipeline.approvedSpec, null, 2)}
          </pre>
        </div>
      )}

      {/* New Pipeline */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onNewPipeline}
          className="px-6 py-2.5 text-sm rounded-xl bg-ak-primary text-ak-bg font-medium hover:bg-ak-primary/90 shadow-ak-glow-sm transition-all"
        >
          Yeni Pipeline Başlat
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface p-4">
      <p className="text-xs text-ak-text-secondary mb-1">{label}</p>
      <p className="text-lg font-semibold text-ak-text-primary">{value}</p>
    </div>
  );
}
