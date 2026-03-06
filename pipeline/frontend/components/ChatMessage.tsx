import type { ScribeMessage, ScribeClarification } from '../types';

interface Props {
  message: ScribeMessage;
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatMessage({ message, onSuggestionClick }: Props) {
  switch (message.type) {
    case 'user_idea':
    case 'user_answer':
      return (
        <div className="flex justify-end mb-4">
          <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-ak-primary/15 text-ak-text-primary border border-ak-primary/20">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      );

    case 'clarification':
      return <ClarificationBubble data={message.content} onSuggestionClick={onSuggestionClick} />;

    case 'spec_draft':
      return (
        <div className="flex justify-start mb-4">
          <div className="max-w-[90%] px-4 py-3 rounded-2xl rounded-bl-md bg-ak-surface-2 border border-ak-border">
            <div className="flex items-center gap-2 mb-2">
              <AgentIcon />
              <span className="text-xs font-medium text-ak-primary">Scribe</span>
            </div>
            <p className="text-sm text-ak-text-secondary">
              Spec hazır: <strong className="text-ak-text-primary">{message.content.spec.title}</strong>
            </p>
            <p className="text-xs text-ak-text-secondary mt-1">
              Güven: {Math.round(message.content.confidence * 100)}%
            </p>
          </div>
        </div>
      );

    case 'spec_approved':
      return (
        <div className="flex justify-center mb-4">
          <div className="px-4 py-2 rounded-full bg-ak-primary/10 border border-ak-primary/20 text-sm text-ak-primary">
            Spec onaylandı
          </div>
        </div>
      );

    case 'spec_rejected':
      return (
        <div className="flex justify-end mb-4">
          <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-br-md bg-ak-danger/10 border border-ak-danger/20 text-ak-text-primary">
            <p className="text-xs text-ak-danger mb-1">Feedback</p>
            <p className="text-sm">{message.content.feedback}</p>
          </div>
        </div>
      );
  }
}

function ClarificationBubble({
  data,
  onSuggestionClick,
}: {
  data: ScribeClarification;
  onSuggestionClick?: (suggestion: string) => void;
}) {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-[90%] px-4 py-3 rounded-2xl rounded-bl-md bg-ak-surface-2 border border-ak-border">
        <div className="flex items-center gap-2 mb-3">
          <AgentIcon />
          <span className="text-xs font-medium text-ak-primary">Scribe</span>
        </div>
        <div className="space-y-3">
          {data.questions.map((q) => (
            <div key={q.id}>
              <p className="text-sm text-ak-text-primary">{q.question}</p>
              <p className="text-xs text-ak-text-secondary mt-0.5">{q.reason}</p>
              {q.suggestions && q.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {q.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => onSuggestionClick?.(s)}
                      className="px-3 py-1 text-xs rounded-full bg-ak-primary/10 text-ak-primary border border-ak-primary/20 hover:bg-ak-primary/20 transition-colors"
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

function AgentIcon() {
  return (
    <div className="w-5 h-5 rounded-full bg-ak-primary/20 flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-ak-primary" />
    </div>
  );
}
