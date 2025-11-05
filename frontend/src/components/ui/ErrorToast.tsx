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
    <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 max-w-md z-50">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-1 text-sm text-red-700">{error.message}</p>
          {error.code && <p className="mt-1 text-xs text-red-600">Code: {error.code}</p>}
          {error.requestId && (
            <p className="mt-1 text-xs text-red-600">Request ID: {error.requestId}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-red-400 hover:text-red-600"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
