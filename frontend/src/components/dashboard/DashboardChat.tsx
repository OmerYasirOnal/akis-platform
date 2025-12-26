
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import Button from '../common/Button';
import Card from '../common/Card';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export function DashboardChat({ className }: { className?: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState('akis-platform/devagents');
    // Handle auto-scrolling
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        // Mock response for now as backend might be offline
        setTimeout(() => {
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `I received your request regarding **${selectedRepo}**: "${userMsg.content}". \n\n*Note: Backend connection is currently mocked or offline.*`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, assistantMsg]);
            setIsSending(false);
        }, 1000);
    };

    return (
        <Card className={cn("flex flex-col h-[500px] p-0 overflow-hidden bg-ak-surface", className)}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ak-border px-4 py-3 bg-ak-surface-2">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-ak-primary animate-pulse" />
                    <span className="text-sm font-semibold text-ak-text-primary">Scribe Orchestrator</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-ak-text-secondary">Context:</span>
                    <select
                        className="bg-ak-bg text-xs text-ak-text-primary border border-ak-border rounded px-2 py-1 focus:border-ak-primary focus:outline-none"
                        value={selectedRepo}
                        onChange={(e) => setSelectedRepo(e.target.value)}
                    >
                        <option value="akis-platform/devagents">akis-platform/devagents</option>
                        <option value="akis-platform/frontend-v2">akis-platform/frontend-v2</option>
                    </select>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ak-bg/30">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-ak-text-secondary opacity-50 space-y-2">
                        <span className="text-4xl">🤖</span>
                        <p>Ask Scribe to write code, review PRs, or analyze logs.</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                            msg.role === 'user'
                                ? "bg-ak-primary text-ak-bg rounded-br-none"
                                : "bg-ak-surface-2 text-ak-text-primary border border-ak-border rounded-bl-none"
                        )}>
                            <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                        </div>
                    </div>
                ))}
                {isSending && (
                    <div className="flex justify-start">
                        <div className="bg-ak-surface-2 text-ak-text-secondary text-xs rounded-2xl px-4 py-2 border border-ak-border">
                            Scribe is thinking...
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-ak-surface-2 border-t border-ak-border">
                <div className="relative">
                    <textarea
                        className="w-full resize-none rounded-xl border border-ak-border bg-ak-bg px-4 py-3 pr-24 text-sm text-ak-text-primary placeholder-ak-text-secondary focus:border-ak-primary focus:outline-none"
                        placeholder="Describe a task or ask a question..."
                        rows={2}
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
                        <Button size="md" className="h-8 px-4 text-xs" onClick={handleSend} disabled={!input.trim() || isSending}>
                            Send
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
