import type { StructuredSpec } from '../../types/workflow';

interface SpecViewProps {
  spec: StructuredSpec;
}

export function SpecView({ spec }: SpecViewProps) {
  const stories = spec.userStories || [];
  const criteria = spec.acceptanceCriteria || [];

  return (
    <div className="space-y-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ak-text-tertiary">
        Structured Spec
      </p>

      {/* Problem Statement */}
      {spec.problemStatement && (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold text-ak-primary">Problem Statement</h4>
          <div className="rounded-lg bg-ak-surface-2 p-3 text-sm leading-relaxed text-ak-text-primary">
            {spec.problemStatement}
          </div>
        </div>
      )}

      {/* User Stories */}
      {stories.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold text-ak-primary">User Stories</h4>
          <div className="space-y-2">
            {stories.map((story, i) => (
              <div key={i} className="rounded-lg border border-ak-border bg-ak-surface p-3 text-sm">
                <span className="text-ak-text-tertiary">As </span>
                <span className="font-medium text-ak-text-primary">{story.persona || story.as}</span>
                <span className="text-ak-text-tertiary">, I want </span>
                <span className="font-medium text-ak-text-primary">{story.action || story.iWant}</span>
                <span className="text-ak-text-tertiary">, so that </span>
                <span className="font-medium text-ak-text-primary">{story.benefit || story.soThat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acceptance Criteria */}
      {criteria.length > 0 && (
        <div>
          <h4 className="mb-1.5 text-xs font-semibold text-ak-primary">Acceptance Criteria</h4>
          <div className="space-y-2">
            {criteria.map((ac, i) => (
              <div key={i} className="rounded-lg border border-ak-border bg-ak-surface p-3 text-sm">
                <span className="text-ak-text-tertiary">Given </span>
                <span className="font-medium text-ak-text-primary">{ac.given}</span>
                <span className="text-ak-text-tertiary">, When </span>
                <span className="font-medium text-ak-text-primary">{ac.when}</span>
                <span className="text-ak-text-tertiary">, Then </span>
                <span className="font-medium text-ak-text-primary">{ac.then}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
