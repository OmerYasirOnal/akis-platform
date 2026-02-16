import type { ReactNode } from 'react';
import { cn } from '../../../../utils/cn';

export interface ConversationPaneProps {
  children: ReactNode;
  className?: string;
}

/**
 * Minimal wrapper for Hub conversation surface.
 * Keeps spacing and scroll behavior consistent while allowing gradual extraction.
 */
export function ConversationPane({ children, className }: ConversationPaneProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-5 py-4 space-y-3', className)}>
      {children}
    </div>
  );
}

export default ConversationPane;
