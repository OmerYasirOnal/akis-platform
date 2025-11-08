import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { label, description, error, rightElement, className, id, ...rest },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hasError = Boolean(error);
    const describedBy = hasError
      ? `${inputId}-error`
      : description
      ? `${inputId}-description`
      : undefined;

    return (
      <div className="flex flex-col gap-2">
        {label ? (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ak-text-primary"
          >
            {label}
          </label>
        ) : null}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl border border-ak-border bg-ak-surface px-4 py-3 text-base text-ak-text-primary placeholder:text-ak-text-secondary/70 transition-colors duration-150 focus:border-ak-primary focus:outline-none focus:ring-2 focus:ring-ak-primary/70',
              rightElement && 'pr-14',
              hasError &&
                'border-ak-danger focus:border-ak-danger focus:ring-ak-danger/70',
              className
            )}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            {...rest}
          />
          {rightElement ? (
            <div className="absolute inset-y-0 right-4 flex items-center">
              {rightElement}
            </div>
          ) : null}
        </div>

        {description && !hasError ? (
          <p
            id={`${inputId}-description`}
            className="text-xs text-ak-text-secondary"
          >
            {description}
          </p>
        ) : null}

        {hasError ? (
          <p id={`${inputId}-error`} className="text-xs text-ak-danger">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

