import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import SearchableSelect, { type SelectOption } from '../../../components/common/SearchableSelect';
import { DashboardChat } from '../../../components/dashboard/DashboardChat';
import {
  githubDiscoveryApi,
  type GitHubOwner,
  type GitHubRepo,
  type GitHubBranch,
} from '../../../services/api/github-discovery';

type BranchMode = 'existing' | 'new';

type FallbackRepoMap = Record<string, GitHubRepo[]>;

const FALLBACK_OWNERS: GitHubOwner[] = [
  { login: 'akis-platform', type: 'Organization', avatarUrl: '' },
  { login: 'demo-team', type: 'Organization', avatarUrl: '' },
];

const FALLBACK_REPOS: FallbackRepoMap = {
  'akis-platform': [
    {
      name: 'docs-hub',
      fullName: 'akis-platform/docs-hub',
      defaultBranch: 'main',
      private: true,
      description: 'Documentation workspace for AKIS.',
    },
    {
      name: 'scribe-playground',
      fullName: 'akis-platform/scribe-playground',
      defaultBranch: 'main',
      private: false,
      description: 'Public demo repository for Scribe.',
    },
  ],
  'demo-team': [
    {
      name: 'product-notes',
      fullName: 'demo-team/product-notes',
      defaultBranch: 'main',
      private: true,
      description: 'Product notes and release docs.',
    },
  ],
};

const FALLBACK_BRANCHES: GitHubBranch[] = [
  { name: 'main', isDefault: true },
  { name: 'develop', isDefault: false },
  { name: 'docs', isDefault: false },
];

const generateBranchName = (repoName?: string) => {
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const repoSlug = repoName
    ? repoName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    : 'repo';
  return `docs/scribe-${repoSlug}-${dateStamp}`;
};

const DashboardAgentScribePage = () => {
  const [owners, setOwners] = useState<GitHubOwner[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [branches, setBranches] = useState<GitHubBranch[]>([]);
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [baseBranch, setBaseBranch] = useState('');
  const [branchMode, setBranchMode] = useState<BranchMode>('existing');
  const [newBranch, setNewBranch] = useState('');
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [usingMockData, setUsingMockData] = useState(false);
  const [githubNotice, setGithubNotice] = useState<string | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupNotice, setSetupNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadOwners = async () => {
      setLoadingOwners(true);
      try {
        const result = await githubDiscoveryApi.getOwners();
        if (!active) return;

        if (result.owners.length > 0) {
          setOwners(result.owners);
          setOwner((prev) => prev || result.owners[0].login);
          setUsingMockData(false);
          setGithubNotice(null);
          return;
        }

        setUsingMockData(true);
        setGithubNotice('TODO: GitHub listing unavailable. Using mock repositories.');
        setOwners(FALLBACK_OWNERS);
        setOwner((prev) => prev || FALLBACK_OWNERS[0].login);
      } catch {
        if (!active) return;
        setUsingMockData(true);
        setGithubNotice('TODO: Connect GitHub to load real repositories. Mock data shown.');
        setOwners(FALLBACK_OWNERS);
        setOwner((prev) => prev || FALLBACK_OWNERS[0].login);
      } finally {
        if (active) {
          setLoadingOwners(false);
        }
      }
    };

    void loadOwners();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!owner) {
      setRepos([]);
      setRepo('');
      return;
    }

    let active = true;

    const loadRepos = async () => {
      setLoadingRepos(true);
      setRepo('');
      setRepos([]);
      setBranches([]);
      setBaseBranch('');

      if (usingMockData) {
        const fallbackRepos = FALLBACK_REPOS[owner] ?? [];
        setRepos(fallbackRepos);
        setRepo(fallbackRepos[0]?.name ?? '');
        setLoadingRepos(false);
        return;
      }

      try {
        const result = await githubDiscoveryApi.getRepos(owner);
        if (!active) return;
        setRepos(result.repos);
        setRepo((prev) => prev || result.repos[0]?.name || '');
      } catch {
        if (!active) return;
        setUsingMockData(true);
        setGithubNotice('TODO: GitHub repo list is mocked until integrations are connected.');
        const fallbackRepos = FALLBACK_REPOS[owner] ?? [];
        setRepos(fallbackRepos);
        setRepo((prev) => prev || fallbackRepos[0]?.name || '');
      } finally {
        if (active) {
          setLoadingRepos(false);
        }
      }
    };

    void loadRepos();
    return () => {
      active = false;
    };
  }, [owner, usingMockData]);

  useEffect(() => {
    if (!owner || !repo) {
      setBranches([]);
      setBaseBranch('');
      return;
    }

    let active = true;

    const loadBranches = async () => {
      setLoadingBranches(true);
      setBranches([]);

      if (usingMockData) {
        setBranches(FALLBACK_BRANCHES);
        setBaseBranch((prev) => prev || 'main');
        setLoadingBranches(false);
        return;
      }

      try {
        const result = await githubDiscoveryApi.getBranches(owner, repo);
        if (!active) return;
        setBranches(result.branches);
        setBaseBranch((prev) => prev || result.defaultBranch || 'main');
      } catch {
        if (!active) return;
        setUsingMockData(true);
        setGithubNotice('TODO: Branch list is mocked until integrations are connected.');
        setBranches(FALLBACK_BRANCHES);
        setBaseBranch((prev) => prev || 'main');
      } finally {
        if (active) {
          setLoadingBranches(false);
        }
      }
    };

    void loadBranches();
    return () => {
      active = false;
    };
  }, [owner, repo, usingMockData]);

  useEffect(() => {
    setSetupNotice(null);
    setSetupError(null);
  }, [owner, repo, baseBranch, branchMode, newBranch]);

  const ownerOptions = useMemo<SelectOption[]>(
    () =>
      owners.map((item) => ({
        value: item.login,
        label: item.login,
        description: item.type,
        icon: item.avatarUrl ? (
          <img src={item.avatarUrl} alt={item.login} className="h-5 w-5 rounded-full" />
        ) : undefined,
      })),
    [owners]
  );

  const repoOptions = useMemo<SelectOption[]>(
    () =>
      repos.map((item) => ({
        value: item.name,
        label: item.name,
        description: item.description || (item.private ? 'Private repository' : 'Public repository'),
      })),
    [repos]
  );

  const branchOptions = useMemo<SelectOption[]>(
    () =>
      branches.map((item) => ({
        value: item.name,
        label: item.name,
        description: item.isDefault ? 'Default branch' : undefined,
      })),
    [branches]
  );

  const chatContext = owner && repo ? { owner, repo } : undefined;
  const isReady = Boolean(owner.trim()) && Boolean(repo.trim()) && Boolean(baseBranch.trim())
    && (branchMode === 'existing' || Boolean(newBranch.trim()));

  const handleStart = () => {
    if (!isReady) {
      setSetupError('Select a repository and branch strategy before starting Scribe.');
      return;
    }

    setSetupNotice('Setup ready. Start a conversation in the chat panel.');
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-ak-text-primary">Scribe Console</h1>
        <p className="text-sm text-ak-text-secondary">
          Configure your repo context and run a Scribe conversation from one workspace.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <Card className="bg-ak-surface space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ak-text-secondary/70">
                What Scribe can do
              </p>
              <h2 className="text-lg font-semibold text-ak-text-primary">Demo Workflow</h2>
              <p className="text-sm text-ak-text-secondary">
                Scribe reviews repo changes, drafts docs, and keeps knowledge bases aligned.
              </p>
            </div>
            <ol className="space-y-2 text-sm text-ak-text-secondary">
              <li>1. Choose the repo and branch strategy.</li>
              <li>2. Start a Scribe conversation with your ask.</li>
              <li>3. Review outputs in Jobs and iterate.</li>
            </ol>
          </Card>

          <Card className="space-y-5 bg-ak-surface">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ak-text-primary">Setup</h3>
                <p className="text-sm text-ak-text-secondary">
                  Pick a repo and branch strategy for this session.
                </p>
              </div>
              <Link to="/dashboard/integrations" className="text-xs font-semibold text-ak-primary">
                Manage integrations →
              </Link>
            </div>

            {githubNotice ? (
              <div className="rounded-xl border border-ak-border bg-ak-surface-2 px-3 py-2 text-xs text-ak-text-secondary">
                {githubNotice}
              </div>
            ) : null}

            <div className="grid gap-4">
              <SearchableSelect
                label="Repository Owner"
                placeholder="Select owner"
                options={ownerOptions}
                value={owner}
                onChange={(value) => setOwner(value)}
                loading={loadingOwners}
                emptyMessage="No owners available"
                description={usingMockData ? 'Using mock owners for demo layout.' : undefined}
              />

              <SearchableSelect
                label="Repository"
                placeholder="Select repository"
                options={repoOptions}
                value={repo}
                onChange={(value) => setRepo(value)}
                loading={loadingRepos}
                emptyMessage="No repositories available"
                disabled={!owner}
                description={usingMockData ? 'TODO: Replace with GitHub listing once connected.' : undefined}
              />

              <SearchableSelect
                label="Base Branch"
                placeholder="Select branch"
                options={branchOptions}
                value={baseBranch}
                onChange={(value) => setBaseBranch(value)}
                loading={loadingBranches}
                emptyMessage="No branches available"
                disabled={!repo}
                allowManualInput
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-ak-text-primary">Branch Strategy</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex items-start gap-3 rounded-xl border border-ak-border bg-ak-surface-2 px-3 py-3 text-sm text-ak-text-secondary">
                  <input
                    type="radio"
                    name="branch-mode"
                    checked={branchMode === 'existing'}
                    onChange={() => setBranchMode('existing')}
                    className="mt-1 h-4 w-4 border-ak-border text-ak-primary focus:ring-ak-primary"
                  />
                  <span>
                    <span className="font-semibold text-ak-text-primary">Use existing branch</span>
                    <span className="mt-1 block text-xs text-ak-text-secondary">
                      Run Scribe against the selected base branch.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-xl border border-ak-border bg-ak-surface-2 px-3 py-3 text-sm text-ak-text-secondary">
                  <input
                    type="radio"
                    name="branch-mode"
                    checked={branchMode === 'new'}
                    onChange={() => setBranchMode('new')}
                    className="mt-1 h-4 w-4 border-ak-border text-ak-primary focus:ring-ak-primary"
                  />
                  <span>
                    <span className="font-semibold text-ak-text-primary">Create new branch</span>
                    <span className="mt-1 block text-xs text-ak-text-secondary">
                      Generate docs on a fresh branch and review later.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {branchMode === 'new' ? (
              <Input
                label="New Branch Name"
                placeholder="docs/scribe-branch"
                value={newBranch}
                onChange={(event) => setNewBranch(event.target.value)}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setNewBranch(generateBranchName(repo))}
                    className="text-xs font-semibold text-ak-primary"
                  >
                    Auto-generate
                  </button>
                }
              />
            ) : null}

            {setupError ? <p className="text-xs text-ak-danger">{setupError}</p> : null}
            {setupNotice ? (
              <p className="text-xs text-ak-primary">{setupNotice}</p>
            ) : null}

            <Button onClick={handleStart} disabled={!isReady}>
              Start Scribe
            </Button>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <DashboardChat context={chatContext} />
        </div>
      </div>
    </div>
  );
};

export default DashboardAgentScribePage;
