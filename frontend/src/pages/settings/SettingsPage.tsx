import { cn } from '../../utils/cn';

interface ConnectionCard {
  title: string;
  detail: string;
  status: 'connected' | 'warning' | 'disconnected';
  statusText: string;
  icon: string;
}

const CARDS: ConnectionCard[] = [
  {
    title: 'AI Provider',
    detail: 'Claude Sonnet 4.6 via Anthropic API',
    status: 'connected',
    statusText: 'Bağlı',
    icon: '🤖',
  },
  {
    title: 'GitHub',
    detail: 'Personal Access Token',
    status: 'connected',
    statusText: 'Token aktif',
    icon: '🐙',
  },
  {
    title: 'Veritabanı',
    detail: 'PostgreSQL via Docker (localhost:5433)',
    status: 'connected',
    statusText: 'Bağlı',
    icon: '🗄️',
  },
  {
    title: 'Mod',
    detail: 'DEV_MODE aktif — auth bypass, dev user injection',
    status: 'warning',
    statusText: 'DEV_MODE',
    icon: '⚙️',
  },
];

const STATUS_STYLES: Record<string, string> = {
  connected: 'bg-green-500/10 text-green-400',
  warning: 'bg-yellow-500/10 text-yellow-400',
  disconnected: 'bg-red-500/10 text-red-400',
};

const STATUS_DOT: Record<string, string> = {
  connected: 'bg-green-400',
  warning: 'bg-yellow-400',
  disconnected: 'bg-red-400',
};

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-ak-bg">
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <h1 className="mb-1 text-lg font-semibold text-ak-text-primary">Ayarlar</h1>
        <p className="mb-6 text-xs text-ak-text-tertiary">Bağlantı durumları ve sistem yapılandırması.</p>

        <div className="space-y-3">
          {CARDS.map((card) => (
            <div
              key={card.title}
              className="flex items-center gap-4 rounded-xl border border-ak-border bg-ak-surface p-4"
            >
              <span className="text-2xl">{card.icon}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-ak-text-primary">{card.title}</h3>
                <p className="truncate text-xs text-ak-text-tertiary">{card.detail}</p>
              </div>
              <div className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium', STATUS_STYLES[card.status])}>
                <div className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[card.status])} />
                {card.statusText}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
