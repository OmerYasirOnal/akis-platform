import { useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../i18n/useI18n';
import { useScreenshotMode } from '../../hooks/useScreenshotMode';
import { api } from '../../services/api/client';

const STAR_COUNT = 5;

export default function FeedbackWidget() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setRating(0);
    setHoverRating(0);
    setMessage('');
    setError(null);
    setSubmitted(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (rating === 0 || message.trim().length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.submitFeedback({
        rating,
        message: message.trim(),
        page: window.location.pathname,
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 2000);
    } catch {
      setError(t('feedback.error'));
    } finally {
      setSubmitting(false);
    }
  }, [rating, message, t, reset]);

  const shotMode = useScreenshotMode();

  if (!user || shotMode) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open) reset(); }}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-ak-primary text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ak-primary/50"
        aria-label={t('feedback.trigger')}
        data-testid="feedback-trigger"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Slide-out panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border border-white/[0.06] bg-[var(--ak-surface)] p-5 shadow-2xl backdrop-blur-sm"
          data-testid="feedback-panel"
        >
          {submitted ? (
            <div className="py-6 text-center">
              <p className="text-lg font-medium text-[var(--ak-text-primary)]">{t('feedback.thanks')}</p>
              <p className="mt-1 text-sm text-[var(--ak-text-secondary)]">{t('feedback.thanksDetail')}</p>
            </div>
          ) : (
            <>
              <h3 className="text-base font-semibold text-[var(--ak-text-primary)]">{t('feedback.title')}</h3>
              <p className="mt-1 text-sm text-[var(--ak-text-secondary)]">{t('feedback.subtitle')}</p>

              {/* Star rating */}
              <div className="mt-4 flex gap-1" data-testid="feedback-stars">
                {Array.from({ length: STAR_COUNT }, (_, i) => {
                  const starValue = i + 1;
                  const active = starValue <= (hoverRating || rating);
                  return (
                    <button
                      key={starValue}
                      type="button"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className={`h-8 w-8 transition-colors ${active ? 'text-yellow-400' : 'text-white/20'}`}
                      aria-label={`${starValue} star`}
                      data-testid={`feedback-star-${starValue}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  );
                })}
              </div>

              {/* Message textarea */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('feedback.placeholder')}
                aria-label={t('feedback.placeholder')}
                maxLength={2000}
                rows={3}
                className="mt-3 w-full resize-none rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-sm text-[var(--ak-text-primary)] placeholder:text-[var(--ak-text-secondary)]/50 focus:border-ak-primary/40 focus:outline-none"
                data-testid="feedback-message"
              />

              {error && (
                <p className="mt-2 text-sm text-red-400" data-testid="feedback-error">{error}</p>
              )}

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-sm text-[var(--ak-text-secondary)] hover:text-[var(--ak-text-primary)]"
                >
                  {t('feedback.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0 || message.trim().length === 0}
                  className="rounded-lg bg-ak-primary px-4 py-1.5 text-sm font-medium text-white transition-opacity disabled:opacity-40"
                  data-testid="feedback-submit"
                >
                  {submitting ? t('feedback.sending') : t('feedback.send')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
