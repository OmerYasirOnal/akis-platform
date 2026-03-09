const SETTINGS = [
  {
    label: 'AI Provider',
    value: 'Claude Sonnet 4.6 via Anthropic API',
    status: 'Connected',
    statusColor: '#22c55e',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
  },
  {
    label: 'GitHub Integration',
    value: 'OmerYasirOnal \u00b7 Personal Access Token',
    status: 'Connected',
    statusColor: '#22c55e',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
  },
  {
    label: 'Database',
    value: 'PostgreSQL via Docker (localhost:5433)',
    status: 'Active',
    statusColor: '#22c55e',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      </svg>
    ),
  },
  {
    label: 'Auth Mode',
    value: 'DEV_MODE bypass active',
    status: 'Dev Mode',
    statusColor: '#f59e0b',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Settings</h1>
        <p className="mt-1 text-sm text-[#8492a6]">Configure your AKIS workspace connections.</p>
      </div>

      <div className="space-y-3">
        {SETTINGS.map((setting) => (
          <div key={setting.label} className="flex items-center gap-4 rounded-xl border border-[#1e2738] bg-[#131820] p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a2030] text-[#8492a6]">
              {setting.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-[#e2e8f0]">{setting.label}</p>
              <p className="text-xs text-[#8492a6]">{setting.value}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: setting.statusColor }} />
              <span className="text-xs font-medium" style={{ color: setting.statusColor }}>{setting.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
