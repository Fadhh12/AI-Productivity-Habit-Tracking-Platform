'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/nav';

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border-subtle bg-surface-card pb-[env(safe-area-inset-bottom)] lg:hidden">
      {NAV_ITEMS.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 font-label-sm text-label-sm ${
              active ? 'text-primary' : 'text-text-muted'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] leading-none">{tab.icon}</span>
            {tab.shortLabel ?? tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
