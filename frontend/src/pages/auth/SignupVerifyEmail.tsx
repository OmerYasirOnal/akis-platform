import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';

export default function SignupVerifyEmail() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Get signup data from sessionStorage
    const storedData = sessionStorage.getItem('akis_signup_data');
    if (!storedData) {
      // No data found, redirect back to step 1
      navigate('/signup');
      return;
    }
    const data = JSON.parse(storedData);
    setEmail(data.email);

    // Focus first input
    inputRefs.current[0]?.focus();
  }, [navigate]);

  function handleCodeChange(index: number, value: string) {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only take last character
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i];
    }
    setCode(newCode);
    // Focus last filled input or first empty
    const focusIndex = Math.min(pastedData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Replace with real API call to /api/auth/verify-email
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear signup data
      sessionStorage.removeItem('akis_signup_data');

      // Navigate to beta welcome screen
      navigate('/auth/welcome-beta');
    } catch {
      setError('Code is incorrect or expired. Please try again.');
      // Clear code inputs
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendCode() {
    setError('');
    setResending(true);

    try {
      // TODO: Replace with real API call to /api/auth/resend-code
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Show success message
      alert('Verification code resent to your email');
    } catch {
      setError('Unable to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="min-h-screen bg-ak-bg text-ak-text-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-ak-surface-2 border border-ak-border rounded-2xl p-8 shadow-ak-md">
        <h1 className="text-h2 mb-2">Verify your email</h1>
        <p className="text-sm text-ak-text-secondary mb-6">
          We sent a 6-digit code to{' '}
          <span className="text-ak-text-primary font-medium">{email}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-sm font-medium block mb-3">Verification code</label>
            <div className="flex gap-2 justify-center">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  className="w-12 h-14 text-center text-2xl font-semibold border border-ak-border bg-ak-surface text-ak-text-primary rounded-xl focus:border-ak-primary focus:ring-2 focus:ring-ak-primary/70 outline-none transition-colors"
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  required
                />
              ))}
            </div>
          </div>

          {error ? <p className="text-ak-danger text-sm text-center">{error}</p> : null}

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending}
              className="text-sm text-ak-primary hover:underline disabled:opacity-60"
            >
              {resending ? 'Resending...' : "Didn't receive it? Resend code"}
            </button>
          </div>

          <Button type="submit" disabled={submitting} className="w-full justify-center">
            {submitting ? 'Verifying...' : 'Verify'}
          </Button>
        </form>
      </div>
    </main>
  );
}

