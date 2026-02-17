import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Logo from '../../components/branding/Logo';
import { getReturnTo, clearReturnTo, setReturnTo } from '../../utils/returnTo';

export default function PrivacyConsent() {
  const navigate = useNavigate();
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setSubmitting(true);

    try {
      const { AuthAPI } = await import('../../services/api/auth');
      await AuthAPI.updatePreferences({ dataSharingConsent: consent });

      const user = await AuthAPI.me();
      const returnTo = getReturnTo();
      if (!user.hasSeenBetaWelcome) {
        if (returnTo) setReturnTo(returnTo);
        navigate('/auth/welcome-beta');
      } else {
        clearReturnTo();
        navigate(returnTo || '/dashboard');
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
      const returnTo = getReturnTo();
      if (returnTo) setReturnTo(returnTo);
      navigate('/auth/welcome-beta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-ak-bg text-ak-text-primary flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-ak-surface-2 border border-ak-border rounded-2xl p-8 shadow-ak-md">
        <div className="mb-6 flex justify-center">
          <Logo size="sm" linkToHome={false} />
        </div>

        <h1 className="text-h2 mb-4">Help improve AKIS</h1>

        <div className="space-y-6 mb-8 text-ak-text-secondary">
          <p>
            AKIS may collect anonymized usage data to improve the platform. This includes:
          </p>

          <div className="bg-ak-surface border border-ak-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-ak-text-primary mb-3">
              ✓ What we collect (if you opt in):
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-ak-primary mt-0.5">•</span>
                <span>Agent job types and success rates</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ak-primary mt-0.5">•</span>
                <span>Feature usage (which pages you visit)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ak-primary mt-0.5">•</span>
                <span>Error logs (anonymized stack traces)</span>
              </li>
            </ul>
          </div>

          <div className="bg-ak-surface border border-ak-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-ak-text-primary mb-3">
              ✗ What we never collect:
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-ak-danger mt-0.5">✗</span>
                <span>Your code or repository contents</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ak-danger mt-0.5">✗</span>
                <span>Jira/Confluence data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-ak-danger mt-0.5">✗</span>
                <span>Integration tokens or credentials</span>
              </li>
            </ul>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-ak-border bg-ak-surface text-ak-primary focus:ring-2 focus:ring-ak-primary focus:ring-offset-0 focus:ring-offset-ak-surface-2 transition-colors"
            />
            <span className="text-sm">
              I'm okay with AKIS using my anonymized usage data to improve the product. I can
              change this anytime in{' '}
              <span className="text-ak-text-primary font-medium">Settings → Privacy</span>.
            </span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleContinue}
            disabled={submitting}
            className="flex-1 justify-center"
          >
            {submitting ? 'Saving...' : 'Continue to Dashboard'}
          </Button>
          <a
            href="/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ak-primary hover:underline text-center py-3"
          >
            Learn more about privacy
          </a>
        </div>
      </div>
    </main>
  );
}

