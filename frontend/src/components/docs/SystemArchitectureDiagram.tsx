/**
 * High-level system architecture diagram: Frontend → Backend → MCP → AI Provider → DB
 * Uses currentColor for dark/light theme compatibility.
 */
export default function SystemArchitectureDiagram() {
  return (
    <svg
      viewBox="0 0 480 160"
      className="max-w-full h-auto"
      role="img"
      aria-label="AKIS system architecture: Frontend, Backend, MCP Gateway, AI Provider, Database"
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" opacity="0.6" />
        </marker>
      </defs>
      <g stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8">
        <rect x="20" y="40" width="80" height="80" rx="8" fill="var(--ak-surface-2)" stroke="var(--ak-border)" />
        <text x="60" y="75" textAnchor="middle" fill="var(--ak-text-primary)" fontSize="12" fontWeight="600">Frontend</text>
        <text x="60" y="92" textAnchor="middle" fill="var(--ak-text-secondary)" fontSize="10">React+Vite</text>

        <line x1="100" y1="80" x2="140" y2="80" strokeDasharray="4" markerEnd="url(#arrow)" />
        <rect x="140" y="40" width="80" height="80" rx="8" fill="var(--ak-surface-2)" stroke="var(--ak-border)" />
        <text x="180" y="75" textAnchor="middle" fill="var(--ak-text-primary)" fontSize="12" fontWeight="600">Backend</text>
        <text x="180" y="92" textAnchor="middle" fill="var(--ak-text-secondary)" fontSize="10">Fastify</text>

        <line x1="220" y1="80" x2="260" y2="80" strokeDasharray="4" markerEnd="url(#arrow)" />
        <rect x="260" y="40" width="80" height="80" rx="8" fill="var(--ak-surface-2)" stroke="var(--ak-border)" />
        <text x="300" y="75" textAnchor="middle" fill="var(--ak-text-primary)" fontSize="12" fontWeight="600">MCP</text>
        <text x="300" y="92" textAnchor="middle" fill="var(--ak-text-secondary)" fontSize="10">Gateway</text>

        <line x1="340" y1="80" x2="380" y2="80" strokeDasharray="4" markerEnd="url(#arrow)" />
        <rect x="380" y="40" width="80" height="80" rx="8" fill="var(--ak-surface-2)" stroke="var(--ak-border)" />
        <text x="420" y="75" textAnchor="middle" fill="var(--ak-text-primary)" fontSize="12" fontWeight="600">AI</text>
        <text x="420" y="92" textAnchor="middle" fill="var(--ak-text-secondary)" fontSize="10">Provider</text>
      </g>
      <g stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8">
        <line x1="180" y1="120" x2="180" y2="140" strokeDasharray="4" />
        <line x1="180" y1="140" x2="300" y2="140" strokeDasharray="4" markerEnd="url(#arrow)" />
        <line x1="300" y1="140" x2="300" y2="120" strokeDasharray="4" />
        <rect x="240" y="120" width="120" height="30" rx="6" fill="var(--ak-surface-2)" stroke="var(--ak-border)" />
        <text x="300" y="138" textAnchor="middle" fill="var(--ak-text-primary)" fontSize="11" fontWeight="600">PostgreSQL</text>
      </g>
    </svg>
  );
}
