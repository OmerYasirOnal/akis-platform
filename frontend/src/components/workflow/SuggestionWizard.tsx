import { useState } from 'react';

interface WizardQuestion {
  id: string;
  question: string;
  reason?: string;
  suggestions: string[];
}

interface SuggestionWizardProps {
  questions: WizardQuestion[];
  onSubmit: (answers: string) => void;
  onCancel: () => void;
}

export function SuggestionWizard({ questions, onSubmit, onCancel }: SuggestionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [customTexts, setCustomTexts] = useState<Record<number, string>>({});
  const [useCustom, setUseCustom] = useState<Record<number, boolean>>({});

  const question = questions[currentStep];
  const isLast = currentStep === questions.length - 1;
  const currentAnswer = useCustom[currentStep]
    ? customTexts[currentStep]?.trim()
    : answers[currentStep];
  const canGoNext = !!currentAnswer;

  const handleSelect = (suggestion: string) => {
    setAnswers(prev => ({ ...prev, [currentStep]: suggestion }));
    setUseCustom(prev => ({ ...prev, [currentStep]: false }));
  };

  const handleCustomToggle = () => {
    setUseCustom(prev => ({ ...prev, [currentStep]: true }));
    setAnswers(prev => {
      const next = { ...prev };
      delete next[currentStep];
      return next;
    });
  };

  const handleNext = () => {
    // Save custom text as answer if using custom input
    if (useCustom[currentStep]) {
      setAnswers(prev => ({ ...prev, [currentStep]: customTexts[currentStep]?.trim() || '' }));
    }

    if (isLast) {
      // Combine all answers and submit
      const finalAnswers: Record<number, string> = { ...answers };
      if (useCustom[currentStep]) {
        finalAnswers[currentStep] = customTexts[currentStep]?.trim() || '';
      }
      const allAnswers = questions
        .map((_, i) => `${i + 1}. ${finalAnswers[i] || ''}`)
        .join('\n');
      onSubmit(allAnswers);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!question) return null;

  return (
    <div className="border-t border-ak-border bg-ak-surface px-4 py-3">
      {/* Progress bar */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < currentStep
                  ? 'bg-ak-scribe'
                  : i === currentStep
                    ? 'bg-ak-scribe/60'
                    : 'bg-ak-border'
              }`}
            />
          ))}
        </div>
        <span className="text-[10px] font-medium text-ak-text-tertiary">
          {currentStep + 1}/{questions.length}
        </span>
      </div>

      {/* Question */}
      <div className="mb-3">
        <p className="text-sm font-medium text-ak-text-primary">{question.question}</p>
        {question.reason && (
          <p className="mt-0.5 text-xs text-ak-text-tertiary">{question.reason}</p>
        )}
      </div>

      {/* Suggestions as radio-style options */}
      <div className="mb-3 space-y-1.5">
        {question.suggestions.map((suggestion, si) => {
          const isSelected = !useCustom[currentStep] && answers[currentStep] === suggestion;
          return (
            <button
              key={si}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                isSelected
                  ? 'border-ak-scribe/40 bg-ak-scribe/10 text-ak-text-primary'
                  : 'border-ak-border-subtle bg-ak-surface-2 text-ak-text-secondary hover:border-ak-scribe/20 hover:bg-ak-scribe/5'
              }`}
            >
              <span
                className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                  isSelected
                    ? 'border-ak-scribe bg-ak-scribe'
                    : 'border-ak-text-tertiary'
                }`}
              >
                {isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </span>
              <span className="flex-1">{suggestion}</span>
            </button>
          );
        })}

        {/* Custom answer option */}
        <button
          type="button"
          onClick={handleCustomToggle}
          className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
            useCustom[currentStep]
              ? 'border-ak-scribe/40 bg-ak-scribe/10 text-ak-text-primary'
              : 'border-ak-border-subtle bg-ak-surface-2 text-ak-text-secondary hover:border-ak-scribe/20 hover:bg-ak-scribe/5'
          }`}
        >
          <span
            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
              useCustom[currentStep]
                ? 'border-ak-scribe bg-ak-scribe'
                : 'border-ak-text-tertiary'
            }`}
          >
            {useCustom[currentStep] && (
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            )}
          </span>
          <span className="flex-1">Kendi cevabımı yazayım</span>
        </button>

        {useCustom[currentStep] && (
          <input
            type="text"
            value={customTexts[currentStep] || ''}
            onChange={(e) => setCustomTexts(prev => ({ ...prev, [currentStep]: e.target.value }))}
            placeholder="Cevabınızı yazın..."
            autoFocus
            className="w-full rounded-lg border border-ak-border bg-ak-surface-2 px-3 py-2 text-sm text-ak-text-primary placeholder:text-ak-text-tertiary focus:border-ak-scribe focus:outline-none"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={currentStep > 0 ? handleBack : onCancel}
          className="flex items-center gap-1 rounded-lg border border-ak-border px-3 py-1.5 text-xs font-medium text-ak-text-secondary transition-colors hover:bg-ak-hover"
        >
          {currentStep > 0 ? (
            <>
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Geri
            </>
          ) : (
            'İptal'
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className="flex items-center gap-1 rounded-lg bg-ak-scribe px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ak-scribe/80 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLast ? 'Gönder' : 'İleri'}
          {!isLast && (
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
