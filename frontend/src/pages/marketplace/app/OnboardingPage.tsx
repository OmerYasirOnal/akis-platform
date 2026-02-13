import { FormEvent, useState } from 'react';

import { marketplaceApi } from '../../../services/api/marketplace';

function splitComma(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function OnboardingPage() {
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [seniority, setSeniority] = useState('mid');
  const [languages, setLanguages] = useState('en,tr');
  const [preferredLocations, setPreferredLocations] = useState('remote');
  const [skills, setSkills] = useState('react,typescript');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await marketplaceApi.upsertProfile({
        headline,
        bio,
        seniority,
        languages: splitComma(languages),
        preferredLocations: splitComma(preferredLocations),
        remoteOnly: splitComma(preferredLocations).includes('remote'),
        skills: splitComma(skills).map((name) => ({ name })),
      });

      setSuccess('Profile saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-ak-border bg-ak-surface p-5">
      <h2 className="mb-4 text-xl font-semibold text-ak-text-primary">Talent onboarding</h2>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1 text-sm text-ak-text-secondary" htmlFor="headline">
          Headline
          <input
            id="headline"
            className="rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-ak-text-primary"
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-1 text-sm text-ak-text-secondary" htmlFor="bio">
          Bio
          <textarea
            id="bio"
            className="min-h-[120px] rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-ak-text-primary"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            required
          />
        </label>

        <label className="grid gap-1 text-sm text-ak-text-secondary" htmlFor="seniority">
          Seniority
          <select
            id="seniority"
            className="rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-ak-text-primary"
            value={seniority}
            onChange={(event) => setSeniority(event.target.value)}
          >
            <option value="junior">Junior</option>
            <option value="mid">Mid</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
          </select>
        </label>

        <label className="grid gap-1 text-sm text-ak-text-secondary" htmlFor="languages">
          Languages (comma-separated)
          <input
            id="languages"
            className="rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-ak-text-primary"
            value={languages}
            onChange={(event) => setLanguages(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm text-ak-text-secondary" htmlFor="preferred-locations">
          Preferred locations (comma-separated)
          <input
            id="preferred-locations"
            className="rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-ak-text-primary"
            value={preferredLocations}
            onChange={(event) => setPreferredLocations(event.target.value)}
          />
        </label>

        <label className="grid gap-1 text-sm text-ak-text-secondary" htmlFor="skills">
          Skills (comma-separated)
          <input
            id="skills"
            className="rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-ak-text-primary"
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
          />
        </label>

        {error && <p role="alert" className="text-sm text-ak-danger">{error}</p>}
        {success && <p role="status" className="text-sm text-ak-primary">{success}</p>}

        <button
          type="submit"
          className="inline-flex w-fit items-center rounded-lg bg-ak-primary px-4 py-2 text-sm font-semibold text-[color:var(--ak-on-primary)] hover:brightness-110 disabled:opacity-70"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </section>
  );
}
