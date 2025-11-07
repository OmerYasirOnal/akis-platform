import React from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonOwnProps<C extends React.ElementType> = {
  as?: C;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

type PolymorphicRef<C extends React.ElementType> =
  React.ComponentPropsWithRef<C>['ref'];

export type ButtonProps<C extends React.ElementType> = ButtonOwnProps<C> &
  Omit<React.ComponentPropsWithoutRef<C>, keyof ButtonOwnProps<C>>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-ak-primary text-ak-bg hover:bg-[#0AE0C0] active:bg-[#05B89B] focus-visible:outline-ak-primary',
  secondary:
    'bg-ak-surface-2 text-ak-text-primary hover:bg-[#192328] active:bg-[#111a1e]',
  outline:
    'bg-transparent border border-ak-border text-ak-text-primary hover:border-ak-primary hover:text-ak-primary',
  ghost:
    'bg-transparent text-ak-text-secondary hover:text-ak-text-primary hover:bg-ak-surface',
};

const sizeClasses: Record<ButtonSize, string> = {
  md: 'px-6 py-2.5 text-sm',
  lg: 'px-8 py-3 text-base',
};

const baseClasses =
  'inline-flex items-center justify-center rounded-full font-semibold tracking-tight transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap';

const Button = React.forwardRef(
  <C extends React.ElementType = 'button'>(
    {
      as,
      variant = 'primary',
      size = 'md',
      className,
      children,
      ...rest
    }: ButtonProps<C>,
    ref: PolymorphicRef<C>
  ) => {
    const Component = as ?? 'button';

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    const finalProps = {
      ref,
      className: classes,
      ...rest,
    } as React.ComponentPropsWithoutRef<C>;

    if (Component === 'button') {
      (finalProps as React.ButtonHTMLAttributes<HTMLButtonElement>).type =
        (rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type ?? 'button';
    }

    return <Component {...finalProps}>{children}</Component>;
  }
);

Button.displayName = 'Button';

export default Button as <
  C extends React.ElementType = 'button'
>(
  props: ButtonProps<C> & { ref?: PolymorphicRef<C> }
) => React.ReactElement | null;

