import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ as: Component = 'div', className, children, ...rest }, ref) => {
    const mergedClassName = cn(
      'rounded-2xl border border-ak-border bg-ak-surface-2 p-6 shadow-lg transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl',
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

