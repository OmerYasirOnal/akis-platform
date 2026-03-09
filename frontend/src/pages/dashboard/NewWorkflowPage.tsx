import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowsApi } from '../../services/api/workflows';

const PIPELINE_STEPS = [
  { label: 'Scribe', color: 'bg-ak-scribe', textColor: 'text-ak-scribe', desc: 'Idea \u2192 Spec' },
  { label: 'You', color: 'bg-ak-primary', textColor: 'text-ak-primary', desc: 'Review' },
  { label: 'Proto', color: 'bg-ak-proto', textColor: 'text-ak-proto', desc: 'Spec \u2192 Code' },
  { label: 'Trace', color: 'bg-ak-trace', textColor: 'text-ak-trace', desc: 'Code \u2192 Tests' },
];

export default function NewWorkflowPage() {
  const navigate = useNavigate();
  const [idea, setIdea] = useState('');
  const [targetRepo, setTargetRepo] = useState('OmerYasirOnal/akis-platform-devolopment');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const workflow = await workflowsApi.create({ idea: idea.trim(), targetRepo: targetRepo.trim() || undefined });
      navigate(`/dashboard/workflows/${workflow.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard/workflows')}
          className="mb-3 flex items-center gap-1 text-caption text-ak-text-secondary transition-colors hover:text-ak-text-primary"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="text-display text-ak-text-primary">New Workflow</h1>
        <p className="mt-1 text-body text-ak-text-secondary">Describe your idea and let the agents build it for you.</p>
      </div>

      {/* Pipeline steps — minimal dot stepper */}
      <div className="flex items-center justify-center gap-1 rounded-xl border border-ak-border bg-ak-surface py-4 px-6">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`h-3 w-3 rounded-full ${step.color} shadow-[0_0_8px_rgba(255,255,255,0.1)]`} />
              <div className="text-center">
                <p className={`text-caption font-semibold ${step.textColor}`}>{step.label}</p>
                <p className="text-micro text-ak-text-tertiary">{step.desc}</p>
              </div>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <div className="mx-3 mb-8 h-px w-8 bg-ak-border" />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="idea" className="mb-1.5 block text-caption font-medium text-ak-text-secondary">
            Your Idea
          </label>
          <textarea
            id="idea"
            rows={6}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your project idea in plain language..."
            className="w-full rounded-xl border border-ak-border bg-ak-bg px-4 py-3 text-body text-ak-text-primary placeholder-ak-text-tertiary transition-all duration-150 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20"
          />
        </div>

        <div>
          <label htmlFor="repo" className="mb-1.5 block text-caption font-medium text-ak-text-secondary">
            Target Repository
          </label>
          <input
            id="repo"
            type="text"
            value={targetRepo}
            onChange={(e) => setTargetRepo(e.target.value)}
            className="w-full rounded-xl border border-ak-border bg-ak-bg px-4 py-2.5 font-mono text-body text-ak-text-primary placeholder-ak-text-tertiary transition-all duration-150 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/20"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-body text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/workflows')}
            className="rounded-lg border border-ak-border px-5 py-2.5 text-body font-medium text-ak-text-secondary transition-all duration-150 hover:bg-ak-hover hover:text-ak-text-primary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !idea.trim()}
            className="rounded-lg bg-ak-primary px-5 py-2.5 text-body font-semibold text-[#0a1215] shadow-ak-glow-sm transition-all duration-150 hover:shadow-ak-glow hover:-translate-y-px disabled:opacity-50 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {submitting ? 'Starting...' : 'Start Workflow'}
          </button>
        </div>
      </form>
    </div>
  );
}
