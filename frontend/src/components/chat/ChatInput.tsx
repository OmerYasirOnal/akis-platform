import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react';
import { cn } from '../../utils/cn';

interface ChatInputProps {
  onSend: (message: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
  showCancel?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, onCancel, disabled, showCancel, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea (1-5 lines)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);

  // Focus on mount and when enabled
  useEffect(() => {
    if (!disabled) textareaRef.current?.focus();
  }, [disabled]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  return (
    <div className="border-t border-ak-border bg-ak-surface px-4 py-3">
      <div className="mx-auto flex max-w-[720px] items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder ?? 'Projenizi anlatın...'}
          rows={1}
          aria-label="Mesaj yaz"
          className={cn(
            'flex-1 resize-none rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-2.5 text-sm text-ak-text-primary',
            'placeholder:text-ak-text-tertiary',
            'focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary/30',
            'transition-colors duration-150',
            disabled && 'cursor-not-allowed opacity-50',
          )}
        />
        {showCancel ? (
          <button
            onClick={onCancel}
            aria-label="İptal et"
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
              'bg-red-500/10 text-red-400 hover:bg-red-500/20',
              'transition-colors duration-150',
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            aria-label="Gönder"
            className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
              'bg-ak-primary text-[color:var(--ak-on-primary)]',
              'hover:brightness-110 active:brightness-95',
              'transition-all duration-150',
              (disabled || !value.trim()) && 'cursor-not-allowed opacity-40',
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
