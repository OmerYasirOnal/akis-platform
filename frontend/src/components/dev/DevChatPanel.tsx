import { useState, useEffect, useRef } from 'react';
import { devSessionApi, type DevChatMessage, type DevFileChange } from '../../services/api/dev-session';

interface DevChatPanelProps {
  pipelineId: string;
  isCompleted: boolean;
}

export function DevChatPanel({ pipelineId, isCompleted }: DevChatPanelProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DevChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [pushingId, setPushingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isCompleted) return;
    devSessionApi.getSession(pipelineId)
      .then((data) => {
        setSessionId(data.session.id);
        setMessages(data.messages);
      })
      .catch(() => { /* no session yet */ });
  }, [pipelineId, isCompleted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      const data = await devSessionApi.startSession(pipelineId);
      setSessionId(data.sessionId);
      setMessages(data.messages || []);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to start dev session:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    setStreamingText('');

    const tempUserMsg: DevChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const response = await devSessionApi.chat(pipelineId, sessionId, userMessage);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text') {
                setStreamingText(data.content);
              }
            } catch { /* skip malformed lines */ }
          }
        }
      }

      setStreamingText('');

      // Refresh messages from backend (correct IDs)
      const sessionData = await devSessionApi.getSession(pipelineId);
      setMessages(sessionData.messages);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Chat error:', err);
      setStreamingText('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePush = async (messageId: string) => {
    if (!sessionId) return;
    setPushingId(messageId);
    try {
      const result = await devSessionApi.pushChanges(pipelineId, sessionId, messageId);
      setMessages(prev => prev.map(m =>
        m.id === messageId
          ? { ...m, changeStatus: 'pushed' as const, commitSha: result.commitSha }
          : m
      ));
    } catch (err) {
      if (import.meta.env.DEV) console.error('Push failed:', err);
    } finally {
      setPushingId(null);
    }
  };

  const handleReject = async (messageId: string) => {
    if (!sessionId) return;
    try {
      await devSessionApi.rejectChanges(pipelineId, sessionId, messageId);
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, changeStatus: 'rejected' as const } : m
      ));
    } catch (err) {
      if (import.meta.env.DEV) console.error('Reject failed:', err);
    }
  };

  if (!isCompleted) return null;

  // Session not started — show start button
  if (!sessionId) {
    return (
      <div id="dev-chat-panel" className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="mb-4 text-4xl opacity-60">&#9889;</div>
        <div className="text-sm text-ak-text-secondary mb-1">
          Pipeline tamamlandi. Gelistirmeye devam etmek icin dev mode'u baslatin.
        </div>
        <div className="text-xs text-ak-text-tertiary mb-4">
          AI agent ile chat ederek yeni ozellikler ekleyin, bug'lari duzeltin.
        </div>
        <button
          onClick={handleStartSession}
          disabled={isStarting}
          className="rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40"
          style={{ backgroundColor: 'var(--ak-primary, #07D1AF)' }}
        >
          {isStarting ? 'Baslatiliyor...' : 'Gelistirmeye Devam Et'}
        </button>
      </div>
    );
  }

  // Chat UI
  return (
    <div id="dev-chat-panel" className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-ak-border px-4 py-2" style={{ backgroundColor: 'var(--ak-surface, #1a1a2e)' }}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-ak-text-tertiary uppercase tracking-wider">Dev Mode</span>
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        <span className="text-xs text-ak-text-tertiary font-mono">
          {messages.filter(m => m.changeStatus === 'pushed').length} commits
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm ${
              msg.role === 'user'
                ? 'bg-ak-primary/10 text-ak-text-primary'
                : 'bg-ak-surface text-ak-text-secondary border border-ak-border'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>

              {/* File changes */}
              {msg.fileChanges && msg.fileChanges.length > 0 && (
                <div className="mt-3 border-t border-ak-border pt-3">
                  <div className="text-xs text-ak-text-tertiary mb-2 font-mono uppercase">
                    {msg.fileChanges.length} dosya degisikligi
                  </div>

                  {(msg.fileChanges as DevFileChange[]).map((change, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-mono py-0.5">
                      <span className={
                        change.action === 'create' ? 'text-green-400' :
                        change.action === 'modify' ? 'text-yellow-400' :
                        'text-red-400'
                      }>
                        {change.action === 'create' ? '+' : change.action === 'modify' ? '~' : '-'}
                      </span>
                      <span className="text-ak-text-tertiary">{change.path}</span>
                    </div>
                  ))}

                  {/* Push/Reject buttons */}
                  {msg.changeStatus === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handlePush(msg.id)}
                        disabled={pushingId === msg.id}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 transition-colors"
                      >
                        {pushingId === msg.id ? 'Pushing...' : 'Push to GitHub'}
                      </button>
                      <button
                        onClick={() => handleReject(msg.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-ak-text-tertiary border border-ak-border hover:bg-ak-hover transition-colors"
                      >
                        Iptal
                      </button>
                    </div>
                  )}

                  {msg.changeStatus === 'pushed' && (
                    <div className="mt-2 text-xs text-green-400 font-mono">
                      Pushed &middot; {msg.commitSha?.slice(0, 7)}
                    </div>
                  )}

                  {msg.changeStatus === 'rejected' && (
                    <div className="mt-2 text-xs text-red-400/60 font-mono">
                      Iptal edildi
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Streaming text */}
        {streamingText && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-xl px-4 py-3 text-sm bg-ak-surface text-ak-text-secondary border border-ak-border">
              <div className="whitespace-pre-wrap">{streamingText}</div>
              <span className="inline-block w-1.5 h-4 bg-ak-text-tertiary animate-pulse ml-0.5" />
            </div>
          </div>
        )}

        {isLoading && !streamingText && (
          <div className="flex justify-start">
            <div className="rounded-xl px-4 py-3 bg-ak-surface border border-ak-border">
              <div className="flex items-center gap-2 text-xs text-ak-text-tertiary">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-ak-primary border-t-transparent" />
                DevAgent dusunuyor...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-ak-border p-3" style={{ backgroundColor: 'var(--ak-surface, #1a1a2e)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ne gelistirmek istiyorsun? (or: login sayfasi ekle)"
            className="flex-1 rounded-xl px-4 py-2.5 text-sm bg-ak-bg-input text-ak-text-primary border border-ak-border focus:border-ak-primary/50 focus:outline-none placeholder:text-ak-text-tertiary"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-30 transition-colors"
            style={{ backgroundColor: 'var(--ak-primary, #07D1AF)' }}
          >
            Gonder
          </button>
        </div>
      </div>
    </div>
  );
}
