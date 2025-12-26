
import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { githubDiscoveryApi, type GitHubRepo } from '../../services/api/github-discovery';
import { Link } from 'react-router-dom';

// Note: In a real app we might use a global context or recoil/redux for this state.
// For now, we'll use local storage to persist the "active" repo across refreshes.
const REPO_STORAGE_KEY = 'akis_active_repo';

// Loading Skeleton
const SidebarSkeleton = () => (
    <div className="space-y-4 animate-pulse px-2">
        <div className="h-4 bg-ak-surface-2 w-1/2 rounded" />
        <div className="space-y-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-2 items-center">
                    <div className="h-5 w-5 bg-ak-surface-2 rounded-full" />
                    <div className="h-3 bg-ak-surface-2 flex-1 rounded" />
                </div>
            ))}
        </div>
    </div>
);

export function RepoSidebar({ className, onRepoSelect }: { className?: string, onRepoSelect?: (repo: string) => void }) {
    const [search, setSearch] = useState('');
    const [repos, setRepos] = useState<GitHubRepo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeRepo, setActiveRepo] = useState<string | null>(() => {
        return localStorage.getItem(REPO_STORAGE_KEY) || null;
    });

    useEffect(() => {
        let mounted = true;
        const fetchRepos = async () => {
            try {
                setIsLoading(true);
                // 1. Get owners first.
                const { owners } = await githubDiscoveryApi.getOwners();

                if (owners.length === 0) {
                    if (mounted) {
                        setRepos([]);
                        setIsLoading(false);
                    }
                    return;
                }

                // Strategy: Fetch repos for the primary owner (usually the user).
                const primaryOwner = owners[0].login;
                const { repos: projectRepos } = await githubDiscoveryApi.getRepos(primaryOwner);

                if (mounted) {
                    setRepos(projectRepos);
                    setError(null);
                }
            } catch (err: unknown) {
                if (mounted) {
                    // Handle 401 specifically (GitHub not connected)
                    const status = (err as { status?: number })?.status;
                    const code = (err as { error?: { code?: string } })?.error?.code;

                    if (status === 401 || code === 'GITHUB_NOT_CONNECTED') {
                        setError('Connect GitHub to see repositories');
                    } else {
                        setError('Failed to load repositories');
                    }
                }
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        fetchRepos();
        return () => { mounted = false; };
    }, []);

    const handleSelectRepo = (fullName: string) => {
        setActiveRepo(fullName);
        localStorage.setItem(REPO_STORAGE_KEY, fullName);
        if (onRepoSelect) onRepoSelect(fullName);
    };

    // Filter
    const filteredRepos = repos.filter(repo =>
        repo.fullName.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <SidebarSkeleton />;

    return (
        <div className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-semibold text-ak-text-primary">Repositories</h2>
                <Link to="/dashboard/integrations" className="text-xs text-ak-primary hover:underline">
                    {error ? 'Connect' : 'Manage'}
                </Link>
            </div>

            {error ? (
                <div className="px-3 py-4 text-xs text-center border border-dashed border-ak-border rounded-lg bg-ak-surface/50">
                    <p className="mb-2 text-ak-text-secondary">{error}</p>
                    <Link to="/dashboard/integrations" className="px-3 py-1 bg-ak-surface-2 border border-ak-primary text-ak-primary rounded hover:bg-ak-surface transition-colors">
                        Connect GitHub
                    </Link>
                </div>
            ) : (
                <>
                    <div className="relative px-1">
                        <input
                            type="text"
                            placeholder="Find a repository..."
                            className="w-full rounded-md border border-ak-border bg-ak-bg px-3 py-1.5 text-sm text-ak-text-primary placeholder-ak-text-secondary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {filteredRepos.length === 0 ? (
                        <div className="text-xs text-ak-text-secondary text-center py-4">
                            {search ? 'No matches found' : 'No repositories found'}
                        </div>
                    ) : (
                        <ul className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar px-1">
                            {filteredRepos.map(repo => (
                                <li key={repo.fullName}>
                                    <button
                                        onClick={() => handleSelectRepo(repo.fullName)}
                                        className={cn(
                                            "w-full group flex gap-2 items-center rounded-md px-2 py-2 transition-colors text-left",
                                            activeRepo === repo.fullName ? "bg-ak-surface-2 border-ak-border" : "hover:bg-ak-surface-2/50"
                                        )}
                                    >
                                        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ak-bg border border-ak-border">
                                            <span className={cn("text-[10px]", repo.private ? "text-ak-text-secondary" : "text-ak-text-primary")}>
                                                {repo.private ? '🔒' : '📚'}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className={cn(
                                                "truncate text-sm font-medium transition-colors",
                                                activeRepo === repo.fullName ? "text-ak-primary" : "text-ak-text-primary group-hover:text-ak-text-primary"
                                            )}>
                                                {repo.name}
                                            </div>
                                            <div className="truncate text-xs text-ak-text-secondary/70">
                                                {repo.fullName.split('/')[0]}
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            <div className="pt-4 border-t border-ak-border px-2">
                <h3 className="text-xs font-semibold text-ak-text-secondary mb-2">Recent activity</h3>
                <div className="text-xs text-ak-text-secondary italic">No recent activity</div>
            </div>
        </div>
    );
}
