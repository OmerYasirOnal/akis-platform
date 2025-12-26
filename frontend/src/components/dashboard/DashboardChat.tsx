
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../utils/cn';
import Button from '../common/Button';
import Card from '../common/Card';
import { agentsApi } from '../../services/api/agents';
import { githubDiscoveryApi, type GitHubRepo } from '../../services/api/github-discovery';
import { ApiError } from '../../services/api/index';

interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

const REPO_STORAGE_KEY = 'akis_active_repo';

export function DashboardChat({ className }: { className?: string }) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Real repository context state
    const [selectedRepo, setSelectedRepo] = useState<string>('');
    const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
    const [isLoadingRepos, setIsLoadingRepos] = useState(false);

    // Handle auto-scrolling
    const endRef = useRef<HTMLDivElement>(null);

    // Load context from storage or fetch
    useEffect(() => {
        const savedRepo = localStorage.getItem(REPO_STORAGE_KEY);
        if (savedRepo) setSelectedRepo(savedRepo);

        // Fetch repos for context dropdown
        const loadRepos = async () => {
            try {
                setIsLoadingRepos(true);
                const { owners } = await githubDiscoveryApi.getOwners();
                if (owners.length > 0) {
                    const primary = owners[0].login;
                    const { repos } = await githubDiscoveryApi.getRepos(primary);
                    setRepositories(repos);
                    if (!savedRepo && repos.length > 0) {
                        setSelectedRepo(repos[0].fullName);
                    }
                }
            } catch (e) {
                console.error('Failed to load repositories based on context', e);
            } finally {
                setIsLoadingRepos(false);
            }
        };
        loadRepos();
    }, []);

    // Listen for storage changes from Sidebar (simple coordination)
    useEffect(() => {
        const handleStorage = () => {
            const current = localStorage.getItem(REPO_STORAGE_KEY);
            if (current && current !== selectedRepo) setSelectedRepo(current);
        };
        window.addEventListener('storage', handleStorage);
        // Also poll purely for this demo since 'storage' event fires mostly on other tabs
        const interval = setInterval(handleStorage, 1000);
        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, [selectedRepo]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        // Guard: Require connection
        if (!selectedRepo) {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: '⚠️ Please select a repository context first.',
                timestamp: Date.now()
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
            // Execute Real Scribe Agent Job
            // We pass the objective (input) and the context (repo) in payload
            const response = await agentsApi.runAgent('scribe', {
                objective: userMsg.content,
                context: {
                    repository: selectedRepo,
                    branch: 'main' // MVP default, future: select branch
                }
            });

            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `I've started Scribe job **${response.jobId}**. status: **${response.state}**.\n\nI'll analyze **${selectedRepo}** and report back shortly.`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, assistantMsg]);

        } catch (err: unknown) {
            console.error(err);
            let errorMessage = 'Failed to start agent. Backend might be unreachable.';

            // Safe alignment with ApiError or generic error
            const apiError = err as Partial<ApiError>;

            if (apiError?.status === 401) errorMessage = 'Authentication required. Please log in.';
            else if (apiError?.status === 500) errorMessage = 'Scribe encountered an internal error.';
            else if (err instanceof Error) errorMessage = err.message;

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: `❌ ${errorMessage}`,
                timestamp: Date.now()
            }]);
        } finally {
            setIsSending(false);
        }
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
                    {isLoadingRepos ? (
                        <span className="text-xs text-ak-text-secondary animate-pulse">Loading...</span>
                    ) : (
                        <select
                            className="bg-ak-bg text-xs text-ak-text-primary border border-ak-border rounded px-2 py-1 focus:border-ak-primary focus:outline-none max-w-[200px]"
                            value={selectedRepo}
                            onChange={(e) => {
                                setSelectedRepo(e.target.value);
                                localStorage.setItem(REPO_STORAGE_KEY, e.target.value);
                            }}
                        >
                            <option value="" disabled>Select Repository</option>
                            {repositories.map(r => (
                                <option key={r.fullName} value={r.fullName}>{r.name}</option>
                            ))}
                            {/* Fallback if list empty or custom */}
                            {!repositories.find(r => r.fullName === selectedRepo) && selectedRepo && (
                                <option value={selectedRepo}>{selectedRepo}</option>
                            )}
                        </select>
                    )}
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
