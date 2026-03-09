import { Outlet } from 'react-router-dom';
import { DashboardSidebar } from './DashboardSidebar';

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-[#0c1017]">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto p-7" style={{ maxWidth: 980 }}>
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
