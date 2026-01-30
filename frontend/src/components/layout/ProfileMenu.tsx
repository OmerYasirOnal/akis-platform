import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../theme/useTheme';
import { cn } from '../../utils/cn';

type ThemeOption = 'system' | 'dark' | 'light';

const SunIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

const MonitorIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
  </svg>
);

const THEME_STORAGE_KEY = 'akis:theme';

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const storedTheme = typeof window !== 'undefined'
    ? window.localStorage.getItem(THEME_STORAGE_KEY)
    : null;
  const activePreference: ThemeOption = storedTheme === 'dark' || storedTheme === 'light'
    ? storedTheme
    : 'system';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleTheme = (opt: ThemeOption) => {
    if (opt === 'system') {
      try { window.localStorage.removeItem(THEME_STORAGE_KEY); } catch {}
      const sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(sys);
      try { window.localStorage.removeItem(THEME_STORAGE_KEY); } catch {}
    } else {
      setTheme(opt);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-ak-surface-2 text-xs font-semibold text-ak-text-primary hover:bg-ak-primary/20 transition-colors"
        aria-label="Profile menu"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-ak-border bg-ak-surface/90 backdrop-blur-xl shadow-ak-elevation-2 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-ak-border">
            <p className="text-sm font-medium text-ak-text-primary truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-ak-text-secondary truncate">{user?.email}</p>
          </div>

          <div className="p-1.5">
            <p className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ak-text-secondary/60">
              Theme
            </p>
            {([
              { id: 'system' as const, label: 'System', icon: <MonitorIcon /> },
              { id: 'dark' as const, label: 'Dark', icon: <MoonIcon /> },
              { id: 'light' as const, label: 'Light', icon: <SunIcon /> },
            ]).map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleTheme(opt.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                  activePreference === opt.id
                    ? 'bg-ak-primary/10 text-ak-primary'
                    : 'text-ak-text-secondary hover:bg-ak-surface-2 hover:text-ak-text-primary'
                )}
              >
                {opt.icon}
                {opt.label}
                {activePreference === opt.id && (
                  <svg className="ml-auto h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="border-t border-ak-border p-1.5">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <LogoutIcon />
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
