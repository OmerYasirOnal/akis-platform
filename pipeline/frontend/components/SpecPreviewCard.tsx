import { useState } from 'react';
import type { StructuredSpec } from '../types';

interface Props {
  spec: StructuredSpec;
  confidence: number;
  onApprove: () => void;
  onReject: (feedback: string) => void;
  onRegenerate: () => void;
  disabled?: boolean;
}

export function SpecPreviewCard({ spec, confidence, onApprove, onReject, onRegenerate, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');

  return (
    <div className="rounded-2xl border border-ak-border bg-ak-surface-2 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-ak-border flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-ak-text-primary">{spec.title}</h3>
          <p className="text-xs text-ak-text-secondary mt-0.5">
            {spec.userStories.length} user story, {spec.acceptanceCriteria.length} acceptance criteria
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${confidence >= 0.8 ? 'bg-ak-primary/10 text-ak-primary' : 'bg-yellow-500/10 text-yellow-400'}`}>
            {Math.round(confidence * 100)}% güven
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-ak-text-secondary hover:text-ak-text-primary transition-colors"
          >
            {expanded ? 'Kapat' : 'Detay'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-3">
        <p className="text-sm text-ak-text-secondary">{spec.problemStatement}</p>

        {spec.technicalConstraints.stack && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-ak-text-secondary">Stack:</span>
            <span className="text-xs px-2 py-0.5 rounded bg-ak-surface border border-ak-border text-ak-text-primary">
              {spec.technicalConstraints.stack}
            </span>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 py-3 border-t border-ak-border space-y-4">
          {/* User Stories */}
          <div>
            <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">User Stories</h4>
            <ul className="space-y-1.5">
              {spec.userStories.map((s, i) => (
                <li key={i} className="text-sm text-ak-text-primary">
                  <span className="text-ak-text-secondary">{s.persona}</span> olarak{' '}
                  <span className="text-ak-primary">{s.action}</span> istiyorum,{' '}
                  <span className="text-ak-text-secondary">{s.benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Acceptance Criteria */}
          <div>
            <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">Acceptance Criteria</h4>
            <ul className="space-y-1.5">
              {spec.acceptanceCriteria.map((ac) => (
                <li key={ac.id} className="text-sm text-ak-text-primary">
                  <span className="text-xs text-ak-text-secondary mr-1">[{ac.id}]</span>
                  Given {ac.given}, when {ac.when}, then {ac.then}
                </li>
              ))}
            </ul>
          </div>

          {/* Out of Scope */}
          {spec.outOfScope.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-ak-text-secondary uppercase tracking-wider mb-2">Out of Scope</h4>
              <div className="flex flex-wrap gap-2">
                {spec.outOfScope.map((item, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-ak-surface border border-ak-border text-ak-text-secondary">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Input */}
      {showFeedback && (
        <div className="px-5 py-3 border-t border-ak-border">
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Neyi değiştirmek istersiniz?"
            className="w-full bg-ak-surface border border-ak-border rounded-xl px-4 py-2.5 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/50 focus:outline-none focus:border-ak-primary/40 resize-none"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowFeedback(false)}
              className="px-3 py-1.5 text-xs text-ak-text-secondary hover:text-ak-text-primary transition-colors"
            >
              İptal
            </button>
            <button
              onClick={() => { onReject(feedback); setShowFeedback(false); setFeedback(''); }}
              disabled={!feedback.trim()}
              className="px-3 py-1.5 text-xs rounded-lg bg-ak-danger/10 text-ak-danger border border-ak-danger/20 hover:bg-ak-danger/20 disabled:opacity-50 transition-colors"
            >
              Gönder
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-5 py-3 border-t border-ak-border flex items-center justify-end gap-3">
        <button
          onClick={onRegenerate}
          disabled={disabled}
          className="px-4 py-2 text-sm rounded-xl text-ak-text-secondary hover:text-ak-text-primary border border-ak-border hover:border-ak-text-secondary/30 disabled:opacity-50 transition-all"
        >
          Yeniden Üret
        </button>
        <button
          onClick={() => setShowFeedback(true)}
          disabled={disabled}
          className="px-4 py-2 text-sm rounded-xl text-ak-danger border border-ak-danger/20 hover:bg-ak-danger/10 disabled:opacity-50 transition-all"
        >
          Düzenle
        </button>
        <button
          onClick={onApprove}
          disabled={disabled}
          className="px-5 py-2 text-sm rounded-xl bg-ak-primary text-ak-bg font-medium hover:bg-ak-primary/90 shadow-ak-glow-sm disabled:opacity-50 transition-all"
        >
          Onayla
        </button>
      </div>
    </div>
  );
}
