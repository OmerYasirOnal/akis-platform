import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
  noHoverLift?: boolean;
  /** Use border instead of shadow for elevation */
  bordered?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ as: Component = 'div', className, children, noHoverLift, bordered: _, ...rest }, ref) => {
    const mergedClassName = cn(
      'rounded-2xl bg-ak-surface-2 p-5 text-ak-text-primary',
      'border border-ak-border shadow-ak-elevation-1',
      !noHoverLift && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-ak-elevation-2 motion-reduce:transition-none motion-reduce:hover:transform-none',
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
