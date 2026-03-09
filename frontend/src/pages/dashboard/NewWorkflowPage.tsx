import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowsApi } from '../../services/api/workflows';

const PIPELINE_STEPS = [
  { label: 'Scribe', color: '#38bdf8', desc: 'Idea \u2192 Spec' },
  { label: 'You', color: '#2dd4a8', desc: 'Review' },
  { label: 'Proto', color: '#f59e0b', desc: 'Spec \u2192 Code' },
  { label: 'Trace', color: '#a78bfa', desc: 'Code \u2192 Tests' },
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard/workflows')}
          className="mb-3 flex items-center gap-1 text-sm text-[#8492a6] transition-colors hover:text-[#e2e8f0]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">New Workflow</h1>
        <p className="mt-1 text-sm text-[#8492a6]">Describe your idea and let the agents build it for you.</p>
      </div>

      {/* Pipeline visualization */}
      <div className="flex items-center justify-center gap-2 rounded-xl border border-[#1e2738] bg-[#131820] py-4">
        {PIPELINE_STEPS.map((step, i) => (
          <div key={step.label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
                style={{ background: `${step.color}18`, color: step.color, border: `1.5px solid ${step.color}` }}
              >
                {step.label[0]}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: step.color }}>{step.label}</p>
                <p className="text-[10px] text-[#4a5568]">{step.desc}</p>
              </div>
            </div>
            {i < PIPELINE_STEPS.length - 1 && (
              <svg className="h-4 w-4 text-[#4a5568]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="idea" className="mb-1.5 block text-sm font-medium text-[#e2e8f0]">Your Idea</label>
          <textarea
            id="idea"
            rows={6}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="Describe your project idea in plain language..."
            className="w-full rounded-lg border border-[#1e2738] bg-[#0c1017] px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#4a5568] focus:border-[#2dd4a8] focus:outline-none focus:ring-1 focus:ring-[#2dd4a8]/30"
          />
        </div>

        <div>
          <label htmlFor="repo" className="mb-1.5 block text-sm font-medium text-[#e2e8f0]">Target Repository</label>
          <input
            id="repo"
            type="text"
            value={targetRepo}
            onChange={(e) => setTargetRepo(e.target.value)}
            className="w-full rounded-lg border border-[#1e2738] bg-[#0c1017] px-4 py-2.5 font-mono text-sm text-[#e2e8f0] placeholder-[#4a5568] focus:border-[#2dd4a8] focus:outline-none focus:ring-1 focus:ring-[#2dd4a8]/30"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard/workflows')}
            className="rounded-lg border border-[#1e2738] px-5 py-2.5 text-sm font-medium text-[#8492a6] transition-colors hover:bg-[#1c2233] hover:text-[#e2e8f0]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !idea.trim()}
            className="rounded-lg bg-[#2dd4a8] px-5 py-2.5 text-sm font-semibold text-[#0c1017] shadow-[0_0_20px_rgba(45,212,168,0.3)] transition-all hover:bg-[#34e0b4] disabled:opacity-50 disabled:shadow-none"
          >
            {submitting ? 'Starting...' : 'Start Workflow'}
          </button>
        </div>
      </form>
    </div>
  );
}
