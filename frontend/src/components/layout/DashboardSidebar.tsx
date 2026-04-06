import { NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { useEffect, useState } from 'react';
import { workflowsApi } from '../../services/api/workflows';
import { AuthAPI } from '../../services/api/auth';
import type { Workflow, WorkflowStatus } from '../../types/workflow';

const HomeIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const WorkflowIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
  </svg>
);

const AgentsIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const CogIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

const PlusIcon = () => (
  <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

function statusDotColor(status: WorkflowStatus): string {
  switch (status) {
    case 'completed':
    case 'completed_partial':
      return 'bg-emerald-400';
    case 'failed':
    case 'cancelled':
      return 'bg-red-400';
    default:
      return 'bg-amber-400';
  }
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
  badge?: number;
}

interface DashboardSidebarProps {
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function DashboardSidebar({ onClose, collapsed: controlledCollapsed, onToggleCollapse }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [workflowCount, setWorkflowCount] = useState(0);
  const [recentWorkflows, setRecentWorkflows] = useState<Workflow[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Use controlled state if provided, otherwise internal
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const toggleCollapse = onToggleCollapse ?? (() => setInternalCollapsed(prev => !prev));

  useEffect(() => {
    workflowsApi.list()
      .then(wfs => {
        setWorkflowCount(wfs.length);
        const sorted = [...wfs].sort((a, b) =>
          new Date(b.updatedAt ?? b.createdAt).getTime() - new Date(a.updatedAt ?? a.createdAt).getTime()
        );
        setRecentWorkflows(sorted.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  // Auto-close sidebar on navigation (mobile)
  useEffect(() => {
    onClose?.();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const mainNav: NavItem[] = [
    { to: '/dashboard', label: 'Genel Bakış', icon: <HomeIcon />, end: true },
    { to: '/dashboard/workflows', label: 'İş Akışları', icon: <WorkflowIcon />, badge: workflowCount || undefined },
    { to: '/dashboard/agents', label: 'Ajanlar', icon: <AgentsIcon /> },
  ];

  const bottomNav: NavItem[] = [
    { to: '/dashboard/settings', label: 'Ayarlar', icon: <CogIcon /> },
  ];

  const renderNavItem = (item: NavItem) => (
    <li key={item.to}>
      <NavLink
        to={item.to}
        end={item.end}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center rounded-lg text-[13px] font-medium transition-all duration-150',
            collapsed ? 'justify-center px-0 py-2' : 'gap-2.5 px-3 py-2',
            isActive
              ? 'bg-gray-100 font-semibold text-ak-text-primary'
              : 'text-ak-text-secondary hover:bg-gray-100 hover:text-ak-text-primary'
          )
        }
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
        {!collapsed && item.badge !== undefined && item.badge > 0 && (
          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-ak-text-secondary">
            {item.badge}
          </span>
        )}
      </NavLink>
    </li>
  );

  return (
    <div
      className="flex h-full flex-col border-r border-ak-border bg-[var(--ak-bg-sidebar)] overflow-y-auto overflow-x-hidden transition-[width] duration-200 ease-out"
      style={{ width: collapsed ? 64 : 230 }}
    >
      {/* Logo + close button */}
      <div className={cn('flex items-center py-5', collapsed ? 'justify-center px-2' : 'justify-between px-5')}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-ak-primary to-emerald-600 text-sm font-bold text-white">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-wide text-ak-text-primary">AKIS</p>
              <p className="text-micro font-medium uppercase tracking-widest text-ak-text-tertiary">Dashboard</p>
            </div>
          )}
        </div>
        {/* Close button — mobile only */}
        {!collapsed && onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-ak-text-tertiary transition-colors hover:bg-gray-100 hover:text-ak-text-primary lg:hidden"
            aria-label="Menüyü kapat"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* New Workflow button */}
      <div className="px-3 pb-2">
        <Link
          to="/dashboard/workflows/new"
          title={collapsed ? 'Yeni İş Akışı' : undefined}
          className={cn(
            'flex items-center rounded-lg border border-dashed border-gray-300 text-[13px] font-medium text-ak-text-secondary transition-all duration-150 hover:border-emerald-400 hover:text-ak-primary hover:bg-gray-50',
            collapsed ? 'justify-center px-0 py-2' : 'gap-2 px-3 py-2'
          )}
        >
          <PlusIcon />
          {!collapsed && <span>Yeni İş Akışı</span>}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-0.5">
          {mainNav.map(renderNavItem)}
        </ul>

        {/* Divider */}
        <div className="mx-3 my-3 border-t border-ak-border-subtle" />

        <ul className="space-y-0.5">
          {bottomNav.map(renderNavItem)}
        </ul>

        {/* Recent Workflows */}
        {!collapsed && recentWorkflows.length > 0 && (
          <>
            <div className="mx-3 my-3 border-t border-ak-border-subtle" />
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ak-text-tertiary">
              Son İş Akışları
            </p>
            <ul className="space-y-0.5">
              {recentWorkflows.map(wf => (
                <li key={wf.id}>
                  <Link
                    to={`/dashboard/workflows/${wf.id}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-[12px] text-ak-text-secondary transition-colors hover:bg-gray-50 hover:text-ak-text-primary"
                  >
                    <span className={cn('h-1.5 w-1.5 flex-shrink-0 rounded-full', statusDotColor(wf.status))} />
                    <span className="truncate">{wf.title || 'Adsız İş Akışı'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-ak-border-subtle px-3 py-3 space-y-2">
        {/* Sign out */}
        <button
          onClick={async () => {
            setLoggingOut(true);
            try {
              await AuthAPI.logout();
            } catch { /* ignore */ }
            navigate('/login', { replace: true });
          }}
          disabled={loggingOut}
          title={collapsed ? (loggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap') : undefined}
          className={cn(
            'flex w-full items-center rounded-lg text-[13px] font-medium text-ak-text-secondary transition-all duration-150 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50',
            collapsed ? 'justify-center py-2 px-0' : 'gap-2.5 px-3 py-2'
          )}
        >
          <LogoutIcon />
          {!collapsed && <span>{loggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className={cn(
            'hidden lg:flex w-full items-center rounded-lg text-[13px] font-medium text-ak-text-tertiary transition-all duration-150 hover:bg-gray-100 hover:text-ak-text-secondary',
            collapsed ? 'justify-center py-2 px-0' : 'gap-2.5 px-3 py-2'
          )}
          title={collapsed ? 'Kenar çubuğunu genişlet' : 'Kenar çubuğunu daralt'}
        >
          <svg className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
          </svg>
          {!collapsed && <span>Daralt</span>}
        </button>

        {/* Version + status */}
        {!collapsed && (
          <div className="flex items-center justify-between px-3">
            <span className="text-micro text-ak-text-tertiary">AKIS v0.2.0</span>
            <div className="flex items-center gap-1" title="Tüm ajanlar aktif">
              <span className="h-1.5 w-1.5 rounded-full bg-ak-scribe" />
              <span className="h-1.5 w-1.5 rounded-full bg-ak-proto" />
              <span className="h-1.5 w-1.5 rounded-full bg-ak-trace" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardSidebar;
