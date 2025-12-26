
import React, { useState } from 'react';
import { cn } from '../../utils/cn';

const MOCK_REPOS = [
    { owner: 'akis-platform', name: 'devagents', description: 'AI Agent Workflow Engine' },
    { owner: 'akis-platform', name: 'frontend-v2', description: 'Modern Dashboard UI' },
    { owner: 'akis-platform', name: 'scribe-service', description: 'PR Automation Agent' },
    { owner: 'akis-platform', name: 'trace-analytics', description: 'Observability Stack' },
];

export function RepoSidebar({ className }: { className?: string }) {
    const [search, setSearch] = useState('');

    const filteredRepos = MOCK_REPOS.filter(repo =>
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        repo.owner.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-semibold text-ak-text-primary">Top Repositories</h2>
                <button className="rounded px-2 py-1 text-xs text-ak-text-primary bg-ak-surface hover:bg-ak-surface-2 transition-colors">
                    New
                </button>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Find a repository..."
                    className="w-full rounded-md border border-ak-border bg-ak-bg px-3 py-1.5 text-sm text-ak-text-primary placeholder-ak-text-secondary focus:border-ak-primary focus:outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <ul className="space-y-1">
                {filteredRepos.map(repo => (
                    <li key={`${repo.owner}/${repo.name}`}>
                        <a
                            href="#"
                            className="group flex gap-2 items-center rounded-md px-2 py-2 hover:bg-ak-surface-2 transition-colors"
                        >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ak-surface border border-ak-border">
                                <span className="text-xs text-ak-text-secondary">📚</span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-sm text-ak-text-primary font-medium group-hover:text-ak-primary transition-colors">
                                    {repo.owner}/{repo.name}
                                </div>
                            </div>
                        </a>
                    </li>
                ))}
            </ul>

            <div className="pt-4 border-t border-ak-border px-2">
                <h3 className="text-xs font-semibold text-ak-text-secondary mb-2">Recent activity</h3>
                <div className="text-xs text-ak-text-secondary italic">No recent activity</div>
            </div>
        </div>
    );
}
