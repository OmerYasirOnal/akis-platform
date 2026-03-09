import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-ak-bg">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto p-8" style={{ maxWidth: 980 }}>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
