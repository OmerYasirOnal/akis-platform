import { useState, useEffect, useCallback } from 'react';
import { cn } from '../../utils/cn';

type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'bg-green-500/15 text-green-400',
  error: 'bg-red-500/15 text-red-400',
  info: 'bg-blue-500/15 text-blue-400',
  warning: 'bg-yellow-500/15 text-yellow-400',
};

let addToastGlobal: ((message: string, variant?: ToastVariant) => void) | null = null;

// eslint-disable-next-line react-refresh/only-export-components
export function toast(message: string, variant: ToastVariant = 'info') {
  addToastGlobal?.(message, variant);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastGlobal = addToast;
    return () => { addToastGlobal = null; };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'rounded-xl px-4 py-3 text-sm font-medium shadow-ak-elevation-2 backdrop-blur-sm animate-in slide-in-from-bottom-2',
            variantStyles[t.variant]
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
