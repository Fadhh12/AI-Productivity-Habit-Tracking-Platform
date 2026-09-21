'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/nav';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="no-scrollbar fixed inset-x-0 bottom-0 z-10 flex overflow-x-auto border-t border-border-subtle bg-surface-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgba(80,102,0,0.18)] backdrop-blur-xl lg:hidden"
    >
      {NAV_ITEMS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`press flex min-w-[68px] flex-1 shrink-0 flex-col items-center gap-0.5 py-2 font-label-sm text-label-sm ${
              active ? 'text-primary' : 'text-text-muted'
            }`}
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full transition-[background-color,transform] duration-500 ease-spring ${
                active ? 'scale-100 bg-accent-lime' : 'scale-90 bg-transparent'
              }`}
            >
              <span
                className="material-symbols-outlined text-[20px] leading-none"
                style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" } : undefined}
              >
                {tab.icon}
              </span>
            </span>
            {tab.shortLabel ?? tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
