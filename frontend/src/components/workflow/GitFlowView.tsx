import type { Workflow } from '../../types/workflow';

interface GitFlowViewProps {
  workflow: Workflow;
}

export function GitFlowView({ workflow }: GitFlowViewProps) {
  const protoMsg = workflow.conversation?.find(m => m.type === 'proto_result');
  const traceMsg = workflow.conversation?.find(m => m.type === 'trace_result');

  const repo = protoMsg?.protoResult?.repo;
  const protoBranch = protoMsg?.protoResult?.branch || workflow.stages.proto.branch;
  const protoFiles = protoMsg?.protoResult?.totalFiles || workflow.stages.proto.files?.length || 0;
  const protoLines = protoMsg?.protoResult?.totalLines || 0;

  const traceTestCount = traceMsg?.traceResult?.testCount || workflow.stages.trace.tests || 0;
  const traceFileCount = traceMsg?.traceResult?.testFiles?.length || 0;
  const traceCoverage = traceMsg?.traceResult?.coverage || workflow.stages.trace.coverage;

  // Derive trace branch from proto branch name
  const traceBranch = protoBranch
    ? protoBranch.replace('proto/scaffold-', 'trace/tests-')
    : null;

  if (!repo || !protoBranch) return null;

  const repoUrl = `https://github.com/${repo}`;
  const protoBranchUrl = `${repoUrl}/tree/${protoBranch}`;
  const traceBranchUrl = traceBranch ? `${repoUrl}/tree/${traceBranch}` : null;

  return (
    <div className="rounded-xl border border-ak-border bg-ak-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-ak-border px-4 py-3 bg-ak-surface">
        <svg className="h-4 w-4 text-ak-text-secondary" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <span className="text-sm font-semibold text-ak-text-primary">Repository</span>
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 font-mono text-xs text-ak-primary hover:underline"
        >
          {repo}
        </a>
      </div>

      {/* Branch diagram */}
      <div className="px-4 py-4">
        {/* Main branch line */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-3 w-3 rounded-full border-2 border-ak-text-tertiary bg-ak-surface" />
          <span className="font-mono text-xs font-semibold text-ak-text-secondary">main</span>
          <div className="flex-1 h-px bg-ak-border" />
        </div>

        {/* Proto branch */}
        <div className="ml-1.5 border-l-2 border-ak-proto/40 pl-5 pb-3">
          <div className="relative">
            {/* Branch connector dot */}
            <div className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-ak-proto" />
            <div className="absolute -left-[19px] top-[11px] h-px w-[14px] bg-ak-proto/40" />

            <a
              href={protoBranchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2"
            >
              <code className="rounded-md bg-ak-proto/10 px-2 py-0.5 font-mono text-[11px] font-medium text-ak-proto group-hover:bg-ak-proto/20 transition-colors">
                ⑂ {protoBranch}
              </code>
            </a>
            <p className="mt-1 text-[11px] text-ak-text-tertiary">
              {protoFiles} files{protoLines > 0 ? `, ${protoLines} lines` : ''}
            </p>
          </div>
        </div>

        {/* Trace branch (if exists) */}
        {workflow.stages.trace.status === 'completed' && (
          <div className="ml-1.5 border-l-2 border-ak-trace/40 pl-5 pb-1">
            <div className="relative">
              <div className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full bg-ak-trace" />
              <div className="absolute -left-[19px] top-[11px] h-px w-[14px] bg-ak-trace/40" />

              {traceBranchUrl ? (
                <a
                  href={traceBranchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2"
                >
                  <code className="rounded-md bg-ak-trace/10 px-2 py-0.5 font-mono text-[11px] font-medium text-ak-trace group-hover:bg-ak-trace/20 transition-colors">
                    ⑂ {traceBranch}
                  </code>
                </a>
              ) : (
                <code className="rounded-md bg-ak-trace/10 px-2 py-0.5 font-mono text-[11px] font-medium text-ak-trace">
                  trace/tests
                </code>
              )}
              <p className="mt-1 text-[11px] text-ak-text-tertiary">
                {traceFileCount} test file{traceFileCount !== 1 ? 's' : ''}, {traceTestCount} test{traceTestCount !== 1 ? 's' : ''}
                {traceCoverage ? `, ${traceCoverage} coverage` : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 border-t border-ak-border px-4 py-3">
        <a
          href={repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-ak-border px-3 py-1.5 text-xs font-medium text-ak-text-secondary transition-colors hover:bg-ak-hover hover:text-ak-text-primary"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          View on GitHub
        </a>
      </div>
    </div>
  );
}
