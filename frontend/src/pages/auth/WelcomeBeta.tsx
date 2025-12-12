import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function WelcomeBeta() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  async function handleContinue() {
    setSubmitting(true);
    
    try {
      const { AuthAPI } = await import('../../services/api/auth');
      await AuthAPI.updatePreferences({ hasSeenBetaWelcome: true });
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Continue anyway - don't block user flow
    } finally {
      setSubmitting(false);
    }
    
    // Navigate to data sharing consent
    navigate('/auth/privacy-consent');
  }

  function handleLearnMore() {
    // Open pricing page in new tab
    window.open('/pricing', '_blank');
  }

  return (
    <main className="min-h-screen bg-ak-bg text-ak-text-primary flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-ak-surface-2 border border-ak-border rounded-2xl p-12 shadow-ak-md text-center">
        <div className="mb-6">
          {/* Logo would go here */}
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold mb-2">Welcome to AKIS!</h1>
          <p className="text-xl text-ak-primary font-semibold">You're in early access</p>
        </div>

        <div className="bg-ak-surface border border-ak-border rounded-xl p-6 mb-8 text-left">
          <p className="text-ak-text-secondary mb-4">
            AKIS is currently in <span className="text-ak-text-primary font-medium">beta</span>. You
            have free access to all agents (Scribe, Trace, Proto) with some usage limits:
          </p>

          <ul className="space-y-2 text-ak-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-ak-primary mt-0.5">•</span>
              <span>100 jobs per month</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ak-primary mt-0.5">•</span>
              <span>Community support (Discord)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ak-primary mt-0.5">•</span>
              <span>7-day log retention</span>
            </li>
          </ul>

          <p className="text-ak-text-secondary mt-4 text-sm">
            Paid plans with unlimited jobs and priority support will launch in Q2 2026. Early users
            get lifetime discounts!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleContinue} disabled={submitting} className="justify-center px-8">
            {submitting ? 'Loading...' : 'Continue to AKIS Dashboard →'}
          </Button>
          <Button onClick={handleLearnMore} variant="outline" className="justify-center px-8">
            Learn more about pricing
          </Button>
        </div>
      </div>
    </main>
  );
}

