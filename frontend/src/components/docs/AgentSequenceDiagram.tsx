/**
 * Agent execution sequence: User → UI → Backend → Orchestrator → Agent → MCP → Result
 * Simplified UML-style sequence diagram.
 */
export default function AgentSequenceDiagram() {
  const participants = ['User', 'UI', 'Backend', 'Orchestrator', 'Agent', 'MCP'];
  const boxWidth = 70;
  const startX = 30;

  return (
    <svg
      viewBox="0 0 480 200"
      className="max-w-full h-auto"
      role="img"
      aria-label="Agent execution sequence: User triggers task, flows through UI, Backend, Orchestrator, Agent, MCP, returns result"
    >
      <defs>
        <marker id="seq-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0 0 L6 3 L0 6 Z" fill="currentColor" opacity="0.7" />
        </marker>
      </defs>
      <g stroke="currentColor" strokeWidth="1" fill="none" opacity="0.85">
        {participants.map((p, i) => {
          const x = startX + i * boxWidth;
          return (
            <g key={p}>
              <rect x={x} y="10" width={boxWidth - 8} height="24" rx="4" fill="var(--ak-surface-2)" stroke="var(--ak-border)" />
              <text x={x + (boxWidth - 8) / 2} y="26" textAnchor="middle" fill="var(--ak-text-primary)" fontSize="10" fontWeight="600">{p}</text>
            </g>
          );
        })}
        <line x1={startX + (boxWidth - 8) / 2} y1="34" x2={startX + (boxWidth - 8) / 2} y2="50" strokeDasharray="2" />
        <line x1={startX + 5 * (boxWidth - 8) / 2 + 20} y1="34" x2={startX + 5 * (boxWidth - 8) / 2 + 20} y2="50" strokeDasharray="2" />
        <line x1={startX + 15} y1="50" x2={startX + boxWidth - 20} y2="50" markerEnd="url(#seq-arrow)" />
        <text x={startX + 45} y="44" fill="var(--ak-text-secondary)" fontSize="9">trigger</text>
        <line x1={startX + boxWidth - 20} y1="70" x2={startX + 15} y2="70" markerEnd="url(#seq-arrow)" strokeDasharray="3" />
        <text x={startX + 45} y="64" fill="var(--ak-text-secondary)" fontSize="9">result</text>
      </g>
      <g fill="var(--ak-text-secondary)" fontSize="10">
        <text x="20" y="95">1. User triggers task</text>
        <text x="20" y="112">2. UI sends to Backend</text>
        <text x="20" y="129">3. Orchestrator assigns Agent</text>
        <text x="20" y="146">4. Agent calls MCP (GitHub/Jira)</text>
        <text x="20" y="163">5. Result flows back</text>
      </g>
    </svg>
  );
}
