
import { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import Button from '../common/Button';
import Card from '../common/Card';
import { agentsApi } from '../../services/api/agents';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    jobId?: string;
    error?: string;
}

interface DashboardChatProps {
    className?: string;
    context?: { owner: string; repo: string };
}

export function DashboardChat({ className, context }: DashboardChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    // Handle auto-scrolling
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        if (!context) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "Please select a repository from the sidebar first.",
                timestamp: Date.now(),
                error: 'NO_CONTEXT'
            }]);
            return;
        }

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsSending(true);

        try {
            // Real Scribe Orchestrator call
            const response = await agentsApi.runAgent('scribe', {
                mode: 'from_config', // Assuming orchestrator supports this or we adapt payload
                owner: context.owner,
                repo: context.repo,
                branch: 'main', // Default branch for now
                objective: input
            });

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `I've started a Scribe job to help with: "${input}". \n\nJob ID: **${response.jobId}**\nState: **${response.state}**`,
                timestamp: Date.now(),
                jobId: response.jobId
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (err: unknown) {
            console.error('Scribe job failed:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Failed to trigger Scribe: ${errorMessage}. \n\nCheck if the backend orchestrator is reachable.`,
                timestamp: Date.now(),
                error: (err as { code?: string })?.code || 'UNKNOWN_ERROR'
            };
            setMessages(prev => [...prev, assistantMsg]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Card className={cn("flex flex-col h-[600px] p-0 overflow-hidden bg-ak-surface", className)}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ak-border px-4 py-3 bg-ak-surface-2">
                <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-ak-primary animate-pulse" />
                    <span className="text-sm font-semibold text-ak-text-primary">Scribe Orchestrator</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-ak-text-secondary">Context:</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-ak-bg text-ak-primary border border-ak-border">
                        {context ? `${context.owner}/${context.repo}` : 'None selected'}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ak-bg/30">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-ak-text-secondary opacity-50 space-y-2">
                        <span className="text-4xl">🤖</span>
                        <p className="max-w-[200px] text-center">Ask Scribe to write code, review PRs, or analyze logs.</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                            msg.role === 'user'
                                ? "bg-ak-primary text-ak-bg rounded-br-none"
                                : cn(
                                    "bg-ak-surface-2 text-ak-text-primary border border-ak-border rounded-bl-none",
                                    msg.error && "border-ak-danger/50 text-ak-danger/90 bg-ak-danger/5"
                                )
                        )}>
                            <div
                                className="whitespace-pre-wrap leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }}
                            />
                            {msg.jobId && (
                                <div className="mt-2 pt-2 border-t border-ak-border/30 text-[10px] uppercase tracking-wider opacity-70">
                                    System Event: Job Created
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isSending && (
                    <div className="flex justify-start">
                        <div className="bg-ak-surface-2 text-ak-text-secondary text-xs rounded-2xl px-4 py-2 border border-ak-border animate-pulse">
                            Connecting to Orchestrator...
                        </div>
                    </div>
                )}
                <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-ak-surface-2 border-t border-ak-border">
                <div className="relative">
                    <textarea
                        className="w-full resize-none rounded-xl border border-ak-border bg-ak-bg px-4 py-3 pr-24 text-sm text-ak-text-primary placeholder-ak-text-secondary focus:border-ak-primary focus:outline-none disabled:opacity-50"
                        placeholder={context ? "Describe a task (e.g. 'Refactor auth middleware')..." : "Please select repo first"}
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
                    <p className="mt-2 text-center text-[10px] text-ak-text-secondary italic">
                        Select a repository from the left sidebar to start a conversation.
                    </p>
                )}
            </div>
        </Card>
    );
}
