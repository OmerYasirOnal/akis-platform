import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import Logo from '../branding/Logo';
import { ProfileMenu } from './ProfileMenu';
import { cn } from '../../utils/cn';

const agentNavItems = [
  { to: '/agents', label: 'Hub', end: true },
  { to: '/agents/scribe', label: 'Scribe' },
  { to: '/agents/trace', label: 'Trace' },
  { to: '/agents/proto', label: 'Proto' },
  { to: '/dashboard/knowledge', label: 'Knowledge Base' },
];

export function AgentsLayout() {
  const location = useLocation();
  const isKnowledgePage = location.pathname === '/dashboard/knowledge';

  return (
    <div className="flex h-screen flex-col bg-ak-bg text-ak-text-primary">
      <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-ak-border bg-ak-surface px-4">
        <div className="flex items-center gap-4">
          <Logo size="nav" />
          <span className="text-sm font-medium text-ak-text-primary">Agents</span>
          <nav className="ml-2 hidden items-center gap-0.5 md:flex">
            {agentNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    isActive || (item.to === '/dashboard/knowledge' && isKnowledgePage)
                      ? 'bg-ak-primary/10 text-ak-primary'
                      : 'text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Dashboard
          </Link>
          <ProfileMenu />
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default AgentsLayout;
