import { Outlet } from 'react-router-dom';

/**
 * Legacy AppShell — no longer used by main router.
 * Kept as a minimal re-export to avoid breaking any stale references.
 */
const AppShell = () => (
  <div className="flex min-h-screen flex-col bg-ak-bg text-ak-text-primary">
    <main className="flex-1">
      <Outlet />
    </main>
  </div>
);

export default AppShell;
