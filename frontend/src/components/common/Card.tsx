import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  /** Disable hover lift animation */
  noHoverLift?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ as: Component = 'div', className, children, noHoverLift, ...rest }, ref) => {
    const mergedClassName = cn(
      // Base styles
      'rounded-2xl border border-ak-border bg-ak-surface-2 p-6 text-ak-text-primary shadow-lg',
      // Motion styles with prefers-reduced-motion support
      !noHoverLift && 'transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:transform-none',
      // Focus styles for accessibility
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ak-primary focus-visible:outline-offset-2',
      className
    );

    return (
      <Component ref={ref} className={mergedClassName} {...rest}>
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export default Card;

