import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { RepoSidebar } from '../../components/dashboard/RepoSidebar';
import { DashboardChat } from '../../components/dashboard/DashboardChat';
import { ChangelogWidget } from '../../components/dashboard/ChangelogWidget';

const STORAGE_KEY = 'akis_dashboard_context';

const DashboardOverviewPage = () => {
  const [selectedRepo, setSelectedRepo] = useState<{ owner: string; repo: string } | undefined>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : undefined;
  });

  useEffect(() => {
    if (selectedRepo) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedRepo));
    }
  }, [selectedRepo]);

  const handleSelectRepo = (owner: string, repo: string) => {
    setSelectedRepo({ owner, repo });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Left Column: Repo Selector */}
      <div className="hidden lg:block lg:col-span-3 xl:col-span-3 space-y-6">
        <RepoSidebar
          onSelectRepo={handleSelectRepo}
          selectedRepo={selectedRepo ? { owner: selectedRepo.owner, name: selectedRepo.repo } : undefined}
        />
      </div>

      {/* Center Column: Main Content */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-ak-text-primary">Home</h1>
          <p className="text-sm text-ak-text-secondary">What would you like to build today?</p>
        </div>

        <DashboardChat context={selectedRepo} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Quick Actions */}
          <Button as={Link} to="/dashboard/jobs/new" variant="outline" size="md" className="h-auto py-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-lg">⚡</span>
            <span className="text-xs font-medium">New Job</span>
          </Button>
          <Button as={Link} to="/dashboard/agents/scribe/run" variant="outline" size="md" className="h-auto py-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-lg">✍️</span>
            <span className="text-xs font-medium">Scribe</span>
          </Button>
          <Button as={Link} to="/dashboard/agents/trace" variant="outline" size="md" className="h-auto py-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-lg">🔍</span>
            <span className="text-xs font-medium">Trace</span>
          </Button>
          <Button as={Link} to="/dashboard/settings/api-keys" variant="outline" size="md" className="h-auto py-3 flex flex-col gap-1 items-center justify-center text-center">
            <span className="text-lg">🔑</span>
            <span className="text-xs font-medium">Keys</span>
          </Button>
        </div>

        <div className="space-y-4">
          <h2 className="text-base font-semibold text-ak-text-primary">Activity Feed</h2>
          {selectedRepo ? (
            <>
              <Card className="bg-ak-surface p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-ak-surface-2 flex items-center justify-center border border-ak-border flex-shrink-0">
                    🤖
                  </div>
                  <div>
                    <p className="text-sm text-ak-text-primary"><span className="font-semibold">Scribe</span> opened a PR on <span className="font-medium text-ak-primary">{selectedRepo.owner}/{selectedRepo.repo}</span></p>
                    <p className="text-xs text-ak-text-secondary mt-1">feat: update endpoints to use new trace schema</p>
                    <div className="mt-2 text-xs text-ak-text-secondary">2 hours ago</div>
                  </div>
                </div>
              </Card>
              <Card className="bg-ak-surface p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-ak-surface-2 flex items-center justify-center border border-ak-border flex-shrink-0">
                    🔄
                  </div>
                  <div>
                    <p className="text-sm text-ak-text-primary">Job <span className="font-mono text-ak-text-secondary">#job-123</span> completed successfully</p>
                    <p className="text-xs text-ak-text-secondary mt-1">Refactor authentication middleware</p>
                    <div className="mt-2 text-xs text-ak-text-secondary">5 hours ago</div>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <div className="p-8 text-center bg-ak-surface/50 rounded-xl border border-dashed border-ak-border text-ak-text-secondary text-sm">
              Connect a repository to see recent activity.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Widgets */}
      <div className="hidden xl:block xl:col-span-3 space-y-6">
        <ChangelogWidget />
      </div>
    </div>
  );
};

export default DashboardOverviewPage;

