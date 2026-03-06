import type { TraceOutput, StructuredSpec } from '../types';

interface Props {
  spec: StructuredSpec;
  traceOutput: TraceOutput;
}

export function CoverageMatrix({ spec, traceOutput }: Props) {
  const { coverageMatrix, testSummary } = traceOutput;

  return (
    <div className="rounded-2xl border border-ak-border bg-ak-surface-2 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-ak-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-ak-text-primary">Test Coverage</h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-ak-text-secondary">{testSummary.totalTests} test</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            testSummary.coveragePercentage >= 80 ? 'bg-ak-primary/10 text-ak-primary' :
            testSummary.coveragePercentage >= 50 ? 'bg-yellow-500/10 text-yellow-400' :
            'bg-ak-danger/10 text-ak-danger'
          }`}>
            {testSummary.coveragePercentage}% coverage
          </span>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ak-border">
              <th className="text-left px-5 py-2 text-xs font-medium text-ak-text-secondary">Criteria</th>
              <th className="text-left px-5 py-2 text-xs font-medium text-ak-text-secondary">Açıklama</th>
              <th className="text-left px-5 py-2 text-xs font-medium text-ak-text-secondary">Test Dosyaları</th>
              <th className="text-center px-5 py-2 text-xs font-medium text-ak-text-secondary">Durum</th>
            </tr>
          </thead>
          <tbody>
            {spec.acceptanceCriteria.map((ac) => {
              const tests = coverageMatrix[ac.id] ?? [];
              const covered = tests.length > 0;
              return (
                <tr key={ac.id} className="border-b border-ak-border/50 last:border-0">
                  <td className="px-5 py-2.5 text-xs font-mono text-ak-text-secondary">{ac.id}</td>
                  <td className="px-5 py-2.5 text-xs text-ak-text-primary">
                    Given {ac.given}, when {ac.when}, then {ac.then}
                  </td>
                  <td className="px-5 py-2.5">
                    {tests.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tests.map((t) => (
                          <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-ak-surface font-mono text-ak-text-secondary">
                            {t.split('/').pop()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-ak-text-secondary/50">—</span>
                    )}
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${covered ? 'bg-ak-primary' : 'bg-ak-danger/60'}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Uncovered Warning */}
      {testSummary.uncoveredCriteria.length > 0 && (
        <div className="px-5 py-3 border-t border-ak-border bg-ak-danger/5">
          <p className="text-xs text-ak-danger">
            {testSummary.uncoveredCriteria.length} kapsanmayan criteria: {testSummary.uncoveredCriteria.join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
