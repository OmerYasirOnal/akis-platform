const AGENTS = [
  {
    name: 'Scribe',
    icon: '\u25C6',
    role: 'Spec Writer (Idea \u2192 Spec)',
    color: '#38bdf8',
    description: 'Scribe acts as a business analyst. It takes your free-text idea, asks clarifying questions, and produces a structured specification with Problem Statement, User Stories, and Acceptance Criteria.',
    input: 'ScribeInput { idea, context, targetStack }',
    output: 'ScribeOutput { spec: StructuredSpec, confidence }',
  },
  {
    name: 'Proto',
    icon: '\u2B21',
    role: 'MVP Builder (Spec \u2192 Scaffold)',
    color: '#f59e0b',
    description: 'Proto takes the approved spec and generates a working MVP scaffold. It creates the project structure, components, API routes, and types — then pushes everything to a GitHub branch.',
    input: 'ProtoInput { spec: StructuredSpec, repoName }',
    output: 'ProtoOutput { branch, repo, files[], repoUrl }',
  },
  {
    name: 'Trace',
    icon: '\u25C8',
    role: 'Test Writer (Code \u2192 Tests)',
    color: '#a78bfa',
    description: 'Trace reads the REAL code that Proto pushed to GitHub and writes Playwright automation tests covering the acceptance criteria. It produces a coverage matrix mapping tests to criteria.',
    input: 'TraceInput { repoOwner, repo, branch }',
    output: 'TraceOutput { testFiles[], coverageMatrix }',
  },
];

const CONTRACT_LINES = [
  { agent: 'Scribe', color: '#38bdf8', text: 'Scribe.output  \u2192  { spec: StructuredSpec }' },
  { agent: 'Proto', color: '#f59e0b', text: 'Proto.input   \u2192  { spec: StructuredSpec, targetRepo: string }' },
  { agent: 'Proto', color: '#f59e0b', text: 'Proto.output  \u2192  { branch: string, repo: string, files: string[] }' },
  { agent: 'Trace', color: '#a78bfa', text: 'Trace.input   \u2192  { repoOwner: string, repo: string, branch: string }' },
  { agent: 'Trace', color: '#a78bfa', text: 'Trace.output  \u2192  { testFiles: PlaywrightTestFile[] }' },
];

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Agents</h1>
        <p className="mt-1 text-sm text-[#8492a6]">AKIS sequential pipeline agents and their current status.</p>
      </div>

      {/* Agent Cards */}
      <div className="space-y-4">
        {AGENTS.map((agent) => (
          <div
            key={agent.name}
            className="overflow-hidden rounded-xl border border-[#1e2738] bg-[#131820]"
          >
            <div className="flex" style={{ borderLeft: `3px solid ${agent.color}` }}>
              <div className="flex-1 p-5">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-[52px] w-[52px] items-center justify-center rounded-xl text-xl font-bold"
                    style={{ background: `${agent.color}18`, color: agent.color }}
                  >
                    {agent.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#e2e8f0]">{agent.name}</h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Operational
                      </span>
                    </div>
                    <p className="text-sm text-[#8492a6]">{agent.role}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#8492a6]">{agent.description}</p>
                <div className="mt-3 space-y-1">
                  <p className="font-mono text-xs text-[#4a5568]">
                    <span className="text-[#8492a6]">Input:</span> {agent.input}
                  </p>
                  <p className="font-mono text-xs text-[#4a5568]">
                    <span className="text-[#8492a6]">Output:</span> {agent.output}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Inter-Agent Contract */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#4a5568]">Inter-Agent Contract</h2>
        <div className="overflow-hidden rounded-xl border border-[#1e2738] bg-[#0c1017] p-4">
          <pre className="font-mono text-xs leading-relaxed">
            {CONTRACT_LINES.map((line, i) => (
              <div key={i}>
                <span style={{ color: line.color }}>{line.text.split('\u2192')[0]}</span>
                <span className="text-[#4a5568]">{'\u2192'}</span>
                <span className="text-[#e2e8f0]">{line.text.split('\u2192')[1]}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}
