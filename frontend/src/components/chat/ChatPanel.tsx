import { useRef, useEffect, useState } from 'react';
import { cn } from '../../utils/cn';
import type { ChatMessage as ChatMessageType, ConversationUIState } from '../../types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { EmptyState } from './EmptyState';

interface ChatPanelProps {
  conversationId?: string;
  repoShortName: string;
  repoFullName: string;
  branch?: string;
  prUrl?: string;
  prNumber?: number;
  messages: ChatMessageType[];
  uiState: ConversationUIState;
  isInputEnabled: boolean;
  showCancelButton: boolean;
  inputPlaceholder: string;
  onSend: (message: string) => void;
  onCancel: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRetry: () => void;
  onSkip: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ChatPanel({
  conversationId,
  repoShortName,
  repoFullName,
  branch,
  prUrl,
  prNumber,
  messages,
  uiState,
  isInputEnabled,
  showCancelButton,
  inputPlaceholder,
  onSend,
  onCancel,
  onApprove,
  onReject,
  onRetry,
  onSkip,
  onBack,
  showBackButton,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Show "new messages" button when scrolled up
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      setShowScrollDown(!atBottom && messages.length > 0);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isPending = conversationId === 'pending';
  const isEmpty = !conversationId || (isPending && messages.length === 0);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* Header */}
      {conversationId && (
        <ChatHeader
          repoShortName={repoShortName || 'Yeni Sohbet'}
          repoFullName={repoFullName || ''}
          branch={branch}
          prUrl={prUrl}
          prNumber={prNumber}
          onBack={onBack}
          showBackButton={showBackButton}
        />
      )}

      {/* Messages */}
      {isEmpty ? (
        <EmptyState variant={conversationId ? 'new-conversation' : 'no-conversation'} />
      ) : (
        <div ref={scrollRef} className="relative flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[720px] space-y-4 px-4 py-4">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                message={msg}
                onApprove={onApprove}
                onReject={onReject}
                onRetry={onRetry}
                onSkip={onSkip}
              />
            ))}

            {/* Typing indicator for running agents */}
            {(uiState === 'scribe_running' || uiState === 'scribe_revise' || uiState === 'proto_running' || uiState === 'trace_running' || uiState === 'ci_running') && (
              <div className="flex gap-2.5 animate-in fade-in duration-150">
                <div className={cn(
                  'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border',
                  uiState.includes('scribe') ? 'border-ak-scribe/30 bg-ak-scribe/10' :
                  uiState === 'proto_running' ? 'border-ak-proto/30 bg-ak-proto/10' :
                  uiState === 'ci_running' ? 'border-yellow-400/30 bg-yellow-400/10' :
                  'border-ak-trace/30 bg-ak-trace/10',
                )}>
                  <div className="flex gap-0.5">
                    <span className="h-1 w-1 animate-bounce rounded-full bg-ak-text-tertiary [animation-delay:0ms]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-ak-text-tertiary [animation-delay:150ms]" />
                    <span className="h-1 w-1 animate-bounce rounded-full bg-ak-text-tertiary [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Scroll-to-bottom button */}
          {showScrollDown && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-ak-border bg-ak-surface px-4 py-1.5 text-xs font-medium text-ak-text-secondary shadow-lg hover:text-ak-text-primary transition-colors animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              ↓ Yeni mesajlar
            </button>
          )}
        </div>
      )}

      {/* Input */}
      {conversationId && (
        <ChatInput
          onSend={onSend}
          onCancel={onCancel}
          disabled={!isInputEnabled}
          showCancel={showCancelButton}
          placeholder={inputPlaceholder}
        />
      )}
    </div>
  );
}
