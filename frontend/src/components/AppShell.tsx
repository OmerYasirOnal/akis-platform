import { Outlet } from 'react-router-dom';

/**
 * AppShell - Minimal shell for public routes (auth, legal)
 */
export default function AppShell() {
  return (
    <div className="relative min-h-screen bg-ak-bg text-ak-text-primary">
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
