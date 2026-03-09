import type { StructuredSpec } from '../../types/workflow';

interface SpecViewProps {
  spec: StructuredSpec;
}

export function SpecView({ spec }: SpecViewProps) {
  const stories = spec.userStories || [];
  const criteria = spec.acceptanceCriteria || [];

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-[#4a5568]">
        Structured Spec
      </p>

      {/* Problem Statement */}
      {spec.problemStatement && (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold text-[#2dd4a8]">Problem Statement</h4>
          <div className="rounded-lg bg-[#1a2030] p-3 text-sm leading-relaxed text-[#e2e8f0]">
            {spec.problemStatement}
          </div>
        </div>
      )}

      {/* User Stories */}
      {stories.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold text-[#2dd4a8]">User Stories</h4>
          <div className="space-y-2">
            {stories.map((story, i) => (
              <div key={i} className="rounded-lg border border-[#1e2738] bg-[#131820] p-3 text-sm">
                <span className="text-[#4a5568]">As </span>
                <span className="font-medium text-[#e2e8f0]">{story.persona || story.as}</span>
                <span className="text-[#4a5568]">, I want </span>
                <span className="font-medium text-[#e2e8f0]">{story.action || story.iWant}</span>
                <span className="text-[#4a5568]">, so that </span>
                <span className="font-medium text-[#e2e8f0]">{story.benefit || story.soThat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acceptance Criteria */}
      {criteria.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold text-[#2dd4a8]">Acceptance Criteria</h4>
          <div className="space-y-2">
            {criteria.map((ac, i) => (
              <div key={i} className="rounded-lg border border-[#1e2738] bg-[#131820] p-3 text-sm">
                <span className="text-[#4a5568]">Given </span>
                <span className="font-medium text-[#e2e8f0]">{ac.given}</span>
                <span className="text-[#4a5568]">, When </span>
                <span className="font-medium text-[#e2e8f0]">{ac.when}</span>
                <span className="text-[#4a5568]">, Then </span>
                <span className="font-medium text-[#e2e8f0]">{ac.then}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
