import React, { useState, useRef, useEffect } from 'react';
import type { CrewMessage } from '../../services/api/crew';

interface CrewChatProps {
  messages: CrewMessage[];
  workers: Array<{ id: string; workerRole: string | null; workerColor: string | null }>;
  onSendMessage: (toJobId: string, content: string) => void;
  onBroadcast: (content: string) => void;
}

export const CrewChat: React.FC<CrewChatProps> = ({
  messages,
  workers,
  onSendMessage,
  onBroadcast,
}) => {
  const [input, setInput] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<string>('broadcast');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    if (selectedWorker === 'broadcast') {
      onBroadcast(input.trim());
    } else {
      onSendMessage(selectedWorker, input.trim());
    }
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getRoleColor = (fromRole: string): string => {
    if (fromRole === 'user') return '#60A5FA';
    if (fromRole === 'coordinator') return '#FBBF24';
    const worker = workers.find(w => w.workerRole === fromRole);
    return worker?.workerColor || '#9CA3AF';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-3 min-h-0">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
              style={{ backgroundColor: getRoleColor(msg.fromRole) }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium"
                  style={{ color: getRoleColor(msg.fromRole) }}
                >
                  @{msg.fromRole}
                </span>
                {msg.toRole && (
                  <>
                    <span className="text-xs text-zinc-600">→</span>
                    <span className="text-xs text-zinc-500">@{msg.toRole}</span>
                  </>
                )}
                <span className="text-xs text-zinc-600">
                  {new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-zinc-300 mt-0.5 break-words">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-700/50 p-3">
        <div className="flex items-center gap-2">
          <select
            value={selectedWorker}
            onChange={(e) => setSelectedWorker(e.target.value)}
            className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-300 focus:outline-none focus:border-zinc-500"
          >
            <option value="broadcast">Herkese</option>
            {workers.map(w => (
              <option key={w.id} value={w.id}>
                @{w.workerRole || `worker-${w.id.slice(0, 6)}`}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesaj yaz..."
            className="flex-1 text-sm bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="text-sm px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
};
