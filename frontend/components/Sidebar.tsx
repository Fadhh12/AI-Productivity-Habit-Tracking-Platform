'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/today', label: 'Dashboard', icon: 'grid_view' },
  { href: '/habit-tracker', label: 'Habit Tracker', icon: 'check_circle' },
  { href: '/goals', label: 'Goals & Horizon', icon: 'flag' },
  { href: '/activity-logs', label: 'Activity Logs', icon: 'history_toggle_off' },
  { href: '/reports', label: 'AI Reports & Digest', icon: 'auto_awesome' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col justify-between bg-sidebar-dark p-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
      <div className="flex flex-col gap-space-lg">
        <div className="flex items-center gap-space-sm px-space-sm pt-space-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-lime font-headline-md text-headline-md font-bold text-text-primary">
            C
          </div>
          <span className="font-headline-md text-headline-md tracking-tight text-white">Continuum</span>
        </div>
        <nav className="flex flex-col gap-space-xs px-space-xs">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-space-md rounded-full px-space-md py-space-sm transition-all ${
                  active
                    ? 'bg-accent-lime font-bold text-text-primary shadow-sm'
                    : 'text-text-muted hover:bg-sidebar-card hover:text-white'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-label-lg text-label-lg">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-col gap-space-sm rounded-lg bg-sidebar-card p-space-md">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-accent-lime px-space-sm py-0.5 font-label-sm text-label-sm font-bold uppercase tracking-wider text-text-primary">
            NEW
          </span>
          <span className="material-symbols-outlined text-[18px] text-text-muted">devices</span>
        </div>
        <div className="flex flex-col gap-space-xs">
          <p className="font-label-md text-label-md font-semibold text-white">Mobile &amp; PWA App</p>
          <p className="font-body-sm text-body-sm text-text-muted">
            Rasakan asisten AI-native langsung dari perangkat harianmu.
          </p>
        </div>
        <button
          className="mt-space-xs w-full rounded-full bg-sidebar-dark py-space-xs text-center font-label-sm text-label-sm text-white transition-all hover:bg-accent-lime hover:text-text-primary"
          type="button"
        >
          Install App
        </button>
      </div>
    </aside>
  );
}
