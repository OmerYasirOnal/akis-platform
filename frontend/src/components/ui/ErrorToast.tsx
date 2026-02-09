import { useEffect } from 'react';

interface ErrorToastProps {
  error: { message: string; code?: string; requestId?: string };
  onClose: () => void;
}

export function ErrorToast({ error, onClose }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div role="alert" aria-live="assertive" className="fixed right-4 top-4 z-50 max-w-md rounded-xl border border-ak-border bg-ak-surface-2 p-4 shadow-lg shadow-black/40">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/80">
            Error
          </h3>
          <p className="mt-2 text-sm text-ak-text-primary">{error.message}</p>
          {error.code ? (
            <p className="mt-1 text-xs text-ak-text-secondary/90">Code: {error.code}</p>
          ) : null}
          {error.requestId ? (
            <p className="mt-1 text-xs text-ak-text-secondary/80">
              Request ID: {error.requestId}
            </p>
          ) : null}
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-ak-text-secondary transition-colors hover:text-ak-text-primary"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
