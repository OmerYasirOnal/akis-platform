import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ as: Component = 'div', className, children, ...rest }, ref) => {
    const mergedClassName = cn(
      'rounded-2xl border border-ak-border/60 bg-ak-surface-2/80 p-6 shadow-[0_20px_45px_-35px_rgba(7,209,175,0.45)] backdrop-blur-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_25px_60px_-35px_rgba(7,209,175,0.55)]',
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

