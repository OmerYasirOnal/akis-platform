import { cn } from '../../utils/cn';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 rounded-xl bg-ak-surface p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150',
            activeTab === tab.id
              ? 'bg-ak-surface-2 text-ak-text-primary shadow-ak-elevation-1 border-b-2 border-ak-primary'
              : 'text-ak-text-secondary hover:text-ak-text-primary hover:bg-ak-surface-2/50'
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
              activeTab === tab.id
                ? 'bg-ak-primary/15 text-ak-primary'
                : 'bg-ak-surface-2 text-ak-text-secondary'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
