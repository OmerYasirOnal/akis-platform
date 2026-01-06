import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import Button from '../common/Button';
import Card from '../common/Card';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  error?: string;
}

interface DashboardChatProps {
  className?: string;
  context?: { owner: string; repo: string };
}

const buildStubResponse = (input: string, context: { owner: string; repo: string }) => {
  return [
    'TODO: Scribe chat is in demo mode and is not yet wired to the backend.',
    `Repository: ${context.owner}/${context.repo}`,
    `Request: "${input.trim()}"`,
    'Next: use the Jobs page to review real runs once wiring is complete.',
  ].join('\n');
};

export function DashboardChat({ className, context }: DashboardChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = endRef.current;
    if (node && typeof node.scrollIntoView === 'function') {
      node.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    if (!context) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Select a repository in the setup panel before starting a chat.',
          timestamp: Date.now(),
          error: 'NO_CONTEXT',
        },
      ]);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSending(true);

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: buildStubResponse(input, context),
      timestamp: Date.now(),
    };

    window.setTimeout(() => {
      setMessages((prev) => [...prev, assistantMsg]);
      setIsSending(false);
    }, 600);
  };

  return (
    <Card className={cn('flex h-[600px] flex-col overflow-hidden bg-ak-surface p-0', className)}>
      <div className="flex items-center justify-between border-b border-ak-border bg-ak-surface-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-ak-primary" />
          <span className="text-sm font-semibold text-ak-text-primary">Scribe Chat</span>
          <span className="rounded-full border border-ak-border bg-ak-surface px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-ak-text-secondary">
            Demo
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ak-text-secondary">Context:</span>
          <span className="rounded border border-ak-border bg-ak-bg px-2 py-0.5 text-xs font-mono text-ak-primary">
            {context ? `${context.owner}/${context.repo}` : 'None selected'}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-ak-bg/30 p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center space-y-2 text-ak-text-secondary/70">
            <span className="text-4xl">🤖</span>
            <p className="max-w-[240px] text-center text-sm">
              Ask Scribe to summarize changes, draft docs, or review a diff.
            </p>
            <p className="text-center text-xs">
              Demo mode is on. Messages are not sent to the backend yet.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                msg.role === 'user'
                  ? 'rounded-br-none bg-ak-primary text-ak-bg'
                  : cn(
                      'rounded-bl-none border border-ak-border bg-ak-surface-2 text-ak-text-primary',
                      msg.error && 'border-ak-danger/50 bg-ak-danger/5 text-ak-danger/90'
                    )
              )}
            >
              <div className="whitespace-pre-line leading-relaxed">{msg.content}</div>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="animate-pulse rounded-2xl border border-ak-border bg-ak-surface-2 px-4 py-2 text-xs text-ak-text-secondary">
              Drafting stub response...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-ak-border bg-ak-surface-2 p-4">
        <div className="relative">
          <textarea
            className="w-full resize-none rounded-xl border border-ak-border bg-ak-bg px-4 py-3 pr-24 text-sm text-ak-text-primary placeholder-ak-text-secondary focus:border-ak-primary focus:outline-none"
            placeholder={context ? "Describe a task (e.g. 'Update docs for auth flow')..." : 'Select a repo to start'}
            rows={2}
            disabled={!context || isSending}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="absolute bottom-3 right-3">
            <Button
              size="md"
              className="h-8 px-4 text-xs"
              onClick={handleSend}
              disabled={!input.trim() || isSending || !context}
            >
              {isSending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
        {!context && (
          <p className="mt-2 text-center text-[10px] italic text-ak-text-secondary">
            Select a repository from the setup panel to start a conversation.
          </p>
        )}
      </div>
    </Card>
  );
}
