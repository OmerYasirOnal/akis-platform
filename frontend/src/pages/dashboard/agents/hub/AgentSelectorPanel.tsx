import type { ReactNode } from 'react';
import { cn } from '../../../../utils/cn';

export interface AgentSelectorItem {
  id: string;
  name: string;
  description: string;
  icon: ReactNode;
}

export interface AgentSelectorPanelProps {
  agents: AgentSelectorItem[];
  searchQuery: string;
  searchPlaceholder: string;
  selectedAgentId: string;
  getAgentColor: (id: string) => { bg: string; text: string };
  onSearchChange: (value: string) => void;
  onSelect: (agentId: string) => void;
  className?: string;
}

export function AgentSelectorPanel({
  agents,
  searchQuery,
  searchPlaceholder,
  selectedAgentId,
  getAgentColor,
  onSearchChange,
  onSelect,
  className,
}: AgentSelectorPanelProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="px-1">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-lg bg-ak-bg py-2 pl-3 pr-3 text-sm text-ak-text-primary placeholder:text-ak-text-secondary/40 focus:outline-none focus:ring-1 focus:ring-ak-primary/40 border border-ak-border"
        />
      </div>

      <div>
        <p className="mb-1.5 px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-ak-text-secondary/50">
          Agents
        </p>
        <div className="space-y-0.5">
          {agents.map((agent) => {
            const color = getAgentColor(agent.id);
            const isSelected = selectedAgentId === agent.id;
            return (
              <button
                key={agent.id}
                onClick={() => onSelect(agent.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-all duration-150',
                  isSelected
                    ? 'bg-ak-surface-2 text-ak-text-primary'
                    : 'text-ak-text-secondary hover:bg-ak-surface-2/50 hover:text-ak-text-primary'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                    isSelected ? `${color.bg} ${color.text}` : 'bg-ak-bg text-ak-text-secondary'
                  )}
                >
                  {agent.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-[13px]">{agent.name}</span>
                  <p className="truncate text-[11px] text-ak-text-secondary/70 leading-tight">{agent.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AgentSelectorPanel;
