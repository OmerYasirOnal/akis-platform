/**
 * ClarifyDialog — Modal clarification question dialog for Proto Agent
 *
 * Appears when job state is "waiting_user". Displays up to 3 questions
 * from the agent. User answers each, then submits to resume execution.
 *
 * Based on literature: Zhang & Choi, NAACL'25 — max 3 clarification
 * rounds with progress indicator (filled dots).
 *
 * UX spec: Chat-style modal with progress dots, input field, and
 * submit button. Cancel aborts the job.
 */

import { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';

export interface ClarifyDialogProps {
  open: boolean;
  questions: string[];
  round: number;
  maxRounds?: number;
  onSubmit: (answers: string[]) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ClarifyDialog({
  open,
  questions,
  round,
  maxRounds = 3,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: ClarifyDialogProps) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''));
  const inputRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Reset answers when questions change
  useEffect(() => {
    setAnswers(questions.map(() => ''));
  }, [questions]);

  // Focus first input when dialog opens
  useEffect(() => {
    if (open && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [open]);

  if (!open || questions.length === 0) return null;

  const allAnswered = answers.every((a) => a.trim().length > 0);

  const handleSubmit = () => {
    if (!allAnswered || isSubmitting) return;
    onSubmit(answers.map((a) => a.trim()));
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (index < questions.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (allAnswered) {
        handleSubmit();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border border-white/[0.08] bg-ak-surface shadow-2xl shadow-black/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <span className="text-sm">💬</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ak-text-primary">
                AKIS Agent needs clarification
              </h3>
              <p className="text-xs text-ak-text-secondary">
                Please answer to continue
              </p>
            </div>
          </div>

          {/* Round progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxRounds }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i < round
                    ? 'bg-purple-400'
                    : i === round
                      ? 'bg-purple-400 animate-pulse'
                      : 'bg-white/[0.1]'
                }`}
              />
            ))}
            <span className="ml-2 text-[10px] text-ak-text-secondary font-mono">
              {round}/{maxRounds}
            </span>
          </div>
        </div>

        {/* Questions */}
        <div className="px-6 py-4 space-y-4 max-h-[400px] overflow-y-auto">
          {questions.map((question, index) => (
            <div key={index} className="space-y-2">
              {/* Agent question bubble */}
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-[10px]">🤖</span>
                </div>
                <div className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                  <p className="text-sm text-ak-text-primary leading-relaxed">{question}</p>
                </div>
              </div>

              {/* User answer input */}
              <div className="pl-8">
                <textarea
                  ref={(el) => { inputRefs.current[index] = el; }}
                  value={answers[index] || ''}
                  onChange={(e) => {
                    const next = [...answers];
                    next[index] = e.target.value;
                    setAnswers(next);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  disabled={isSubmitting}
                  rows={2}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-sm text-ak-text-primary placeholder-ak-text-secondary/40 focus:border-purple-400/50 focus:outline-none focus:ring-1 focus:ring-purple-400/30 disabled:opacity-50 resize-none transition-colors"
                  placeholder="Type your answer..."
                />
              </div>
            </div>
          ))}

          {round >= maxRounds && (
            <p className="text-xs text-amber-400/80 text-center">
              Final round — no more questions after this.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs text-ak-text-secondary hover:text-red-400 transition-colors disabled:opacity-50"
          >
            Cancel Job
          </button>

          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
            className="px-4 py-2 text-sm"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
          </Button>
        </div>
      </div>
    </div>
  );
}
