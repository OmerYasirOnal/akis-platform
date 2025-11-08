import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'md' | 'lg';

type ButtonOwnProps<C extends React.ElementType> = {
  as?: C;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: React.ReactNode;
};

export type ButtonProps<C extends React.ElementType> = ButtonOwnProps<C> &
  Omit<React.ComponentPropsWithoutRef<C>, keyof ButtonOwnProps<C>>;

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-ak-primary text-ak-bg hover:bg-ak-primary focus-visible:outline-ak-primary',
  secondary:
    'bg-ak-surface text-ak-text-primary hover:bg-ak-surface-2 focus-visible:outline-ak-primary',
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

function Button<C extends React.ElementType = 'button'>(
  {
    as,
    variant = 'primary',
    size = 'md',
    className,
    children,
    ...rest
  }: ButtonProps<C>,
) {
  const Component = (as ?? 'button') as React.ElementType;

  const classes = cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className
  );

  const finalProps = {
    className: classes,
    ...rest,
  } as React.ComponentPropsWithoutRef<C>;

  if (Component === 'button') {
    (finalProps as React.ButtonHTMLAttributes<HTMLButtonElement>).type =
      (rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type ?? 'button';
  }

  return <Component {...finalProps}>{children}</Component>;
}

export default Button;

