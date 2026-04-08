import { cn } from '../../utils/cn';

interface WizardShellProps {
  currentStep: number;
  totalSteps: number;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  backLabel?: string;
  skipLabel?: string;
  showSkip?: boolean;
  nextDisabled?: boolean;
  loading?: boolean;
}

export function WizardShell({
  currentStep,
  totalSteps,
  children,
  onNext,
  onBack,
  onSkip,
  nextLabel = 'Devam',
  backLabel = 'Geri',
  skipLabel = 'Atla',
  showSkip = false,
  nextDisabled = false,
  loading = false,
}: WizardShellProps) {
  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* Progress bar */}
      <div className="flex gap-2 w-full max-w-xs mb-8">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i < currentStep ? 'bg-ak-primary' :
              i === currentStep ? 'bg-ak-primary/60' :
              'bg-ak-border',
            )}
          />
        ))}
      </div>

      {/* Step content — keyed for animation */}
      <div key={currentStep} className="w-full animate-slide-up">
        {children}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-8 w-full">
        {currentStep > 0 && onBack && (
          <button
            onClick={onBack}
            className="rounded-xl border border-ak-border px-4 py-2.5 text-sm font-medium text-ak-text-secondary hover:bg-ak-surface-2 transition-colors"
          >
            {backLabel}
          </button>
        )}

        <div className="flex-1" />

        {showSkip && onSkip && (
          <button
            onClick={onSkip}
            className="px-4 py-2.5 text-sm font-medium text-ak-text-tertiary hover:text-ak-text-secondary transition-colors"
          >
            {skipLabel}
          </button>
        )}

        {onNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled || loading}
            className={cn(
              'rounded-xl bg-ak-primary px-6 py-2.5 text-sm font-semibold text-[color:var(--ak-on-primary)] transition-all',
              'hover:brightness-110 active:brightness-95',
              (nextDisabled || loading) && 'opacity-50 cursor-not-allowed',
            )}
          >
            {loading ? 'Kaydediliyor...' : nextLabel}
          </button>
        )}
      </div>
    </div>
  );
}
