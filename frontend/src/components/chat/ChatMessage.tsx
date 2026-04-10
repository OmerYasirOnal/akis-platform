import { cn } from '../../utils/cn';
import type { ChatMessage as ChatMessageType, AgentName } from '../../types/chat';
import { PlanCard } from './PlanCard';

interface ChatMessageProps {
  message: ChatMessageType;
  onApprove?: () => void;
  onReject?: () => void;
  onRetry?: () => void;
  onSkip?: () => void;
  onSuggestionClick?: (text: string) => void;
}

const AGENT_COLORS: Record<AgentName, { bg: string; border: string; text: string; label: string }> = {
  scribe: { bg: 'bg-ak-scribe/10', border: 'border-ak-scribe/30', text: 'text-ak-scribe', label: 'Scribe' },
  proto: { bg: 'bg-ak-proto/10', border: 'border-ak-proto/30', text: 'text-ak-proto', label: 'Proto' },
  trace: { bg: 'bg-ak-trace/10', border: 'border-ak-trace/30', text: 'text-ak-trace', label: 'Trace' },
};

function AgentAvatar({ agent }: { agent: AgentName }) {
  const c = AGENT_COLORS[agent];
  const initials = agent[0].toUpperCase();
  return (
    <div className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border', c.bg, c.border)}>
      <span className={cn('text-xs font-bold', c.text)}>{initials}</span>
    </div>
  );
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ChatMessage({ message, onApprove, onReject, onRetry, onSkip, onSuggestionClick }: ChatMessageProps) {
  switch (message.type) {
    case 'user':
      return (
        <div className="flex justify-end animate-in fade-in slide-in-from-right-2 duration-200">
          <div className="max-w-[85%] rounded-2xl bg-ak-primary px-4 py-2.5 text-sm text-[color:var(--ak-on-primary,#fff)]">
            <p className="whitespace-pre-wrap">{message.content}</p>
            <span className="mt-1 block text-right text-[10px] text-[color:var(--ak-on-primary,#fff)] opacity-60">{formatTime(message.timestamp)}</span>
          </div>
        </div>
      );

    case 'agent': {
      const c = AGENT_COLORS[message.agent];
      return (
        <div className="flex gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200">
          <AgentAvatar agent={message.agent} />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span className={cn('text-xs font-semibold', c.text)}>{c.label}</span>
              <span className="text-[10px] text-ak-text-tertiary">{formatTime(message.timestamp)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ak-text-secondary">{message.content}</p>
          </div>
        </div>
      );
    }

    case 'clarification': {
      const cc = AGENT_COLORS[message.role];
      return (
        <div className="flex gap-2.5 animate-in fade-in slide-in-from-left-2 duration-200">
          <AgentAvatar agent={message.role} />
          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-2">
              <span className={cn('text-xs font-semibold', cc.text)}>{AGENT_COLORS[message.role].label}</span>
              <span className="text-[10px] text-ak-text-tertiary">{formatTime(message.timestamp)}</span>
            </div>
            <p className="mb-2 whitespace-pre-wrap text-sm text-ak-text-secondary">{message.content}</p>
            <div className="space-y-2">
              {message.questions.map((q, i) => (
                <div key={q.id} className={cn('rounded-lg border p-3', cc.border, cc.bg)}>
                  <p className="text-sm font-medium text-ak-text-primary">
                    {i + 1}. {q.question}
                  </p>
                  {q.reason && (
                    <p className="mt-1 text-xs text-ak-text-tertiary">{q.reason}</p>
                  )}
                  {q.suggestions && q.suggestions.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {q.suggestions.map((s, si) => (
                        <button
                          key={si}
                          type="button"
                          onClick={() => onSuggestionClick?.(s)}
                          className="rounded-full bg-ak-surface-2 px-2 py-0.5 text-[11px] text-ak-text-secondary hover:bg-ak-primary/15 hover:text-ak-primary hover:scale-[1.03] active:scale-[0.97] cursor-pointer transition-all duration-150"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    case 'plan':
      return (
        <div className="animate-in fade-in zoom-in-[0.98] duration-200">
          <PlanCard
            plan={message.plan}
            version={message.version}
            status={message.status}
            isChangeRequest={false}
            onApprove={message.status === 'active' ? onApprove : undefined}
            onReject={message.status === 'active' ? onReject : undefined}
          />
        </div>
      );

    case 'file_created':
      return (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
          <span className="text-green-400">✓</span>
          <span className="font-mono text-xs text-ak-text-secondary">{message.path}</span>
        </div>
      );

    case 'pr_opened':
      return (
        <div className="rounded-xl border border-ak-proto/20 bg-ak-surface p-4 animate-in fade-in slide-in-from-left-2 duration-200">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-ak-proto">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 16 16">
                <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-ak-text-primary">{message.title}</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-ak-text-tertiary">
            <span className="rounded bg-ak-surface-2 px-2 py-0.5 font-mono">{message.branch}</span>
            <span>{message.filesChanged} dosya</span>
            <span>{message.linesChanged} satır</span>
          </div>
          {message.url && (
            <a
              href={message.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs text-ak-proto hover:underline"
            >
              GitHub'da Gör ↗
            </a>
          )}
        </div>
      );

    case 'test_result':
      return (
        <div className="rounded-xl border border-ak-trace/20 bg-ak-surface p-4 animate-in fade-in slide-in-from-left-2 duration-200">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-ak-trace">🧪</span>
            <span className="text-sm font-semibold text-ak-text-primary">Test Sonuçları</span>
          </div>
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-lg font-bold text-green-400">{message.passed}</span>
              <span className="ml-1 text-ak-text-tertiary">başarılı</span>
            </div>
            {message.failed > 0 && (
              <div>
                <span className="text-lg font-bold text-red-400">{message.failed}</span>
                <span className="ml-1 text-ak-text-tertiary">başarısız</span>
              </div>
            )}
            <div>
              <span className="text-lg font-bold text-ak-text-primary">{message.coverage}%</span>
              <span className="ml-1 text-ak-text-tertiary">kapsam</span>
            </div>
          </div>
          {message.failures && message.failures.length > 0 && (
            <div className="mt-3 space-y-1">
              {message.failures.map((f, i) => (
                <div key={i} className="text-xs text-red-400">
                  {f.file}:{f.line} — {f.message}
                </div>
              ))}
            </div>
          )}
          {message.failed > 0 && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button onClick={onRetry} className="rounded-lg border border-ak-trace/20 px-3 py-1.5 text-xs font-medium text-ak-trace hover:bg-ak-trace/10 transition-colors">
                  🔄 Trace'e Düzelttir
                </button>
              )}
              {onSkip && (
                <button onClick={onSkip} className="rounded-lg border border-ak-border px-3 py-1.5 text-xs font-medium text-ak-text-tertiary hover:text-ak-text-secondary transition-colors">
                  ⏭ Geç
                </button>
              )}
            </div>
          )}
        </div>
      );

    case 'error':
      return (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 animate-in fade-in slide-in-from-left-2 duration-200 animate-shake-subtle">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-red-400">⚠</span>
            <span className="text-sm font-semibold text-red-400">Hata</span>
          </div>
          <p className="text-xs text-ak-text-secondary">{message.message}</p>
          {message.retryable && (
            <div className="mt-3 flex gap-2">
              {onRetry && (
                <button onClick={onRetry} className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                  🔄 Tekrar Dene
                </button>
              )}
              {onSkip && (
                <button onClick={onSkip} className="rounded-lg border border-ak-border px-3 py-1.5 text-xs font-medium text-ak-text-tertiary hover:text-ak-text-secondary transition-colors">
                  ⏭ Atla
                </button>
              )}
            </div>
          )}
        </div>
      );

    case 'info':
      return (
        <div className="flex justify-center animate-in fade-in duration-200">
          <div className="rounded-full border border-ak-border-subtle bg-ak-surface-2 px-4 py-1.5 text-xs text-ak-text-tertiary">
            {message.content}
          </div>
        </div>
      );

    default:
      if (import.meta.env.DEV) {
        console.warn('[ChatMessage] Unknown message type:', (message as Record<string, unknown>).type);
      }
      return null;
  }
}
