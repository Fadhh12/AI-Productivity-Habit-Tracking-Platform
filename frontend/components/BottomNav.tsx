'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, NavItem } from '@/lib/nav';

/** Four everyday destinations stay in the bar; everything else lives in the "Lainnya" sheet. */
const PRIMARY_HREFS = ['/today', '/habit-tracker', '/goals', '/coach'];

const EXTRA: NavItem[] = [
  { href: '/plus', icon: 'workspace_premium', label: 'Continuum Plus' },
  { href: '/account', icon: 'account_circle', label: 'Akun saya' },
];

const SHORT: Record<string, string> = { '/today': 'Beranda' };

export function BottomNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const primary = PRIMARY_HREFS.map((h) => NAV_ITEMS.find((i) => i.href === h)).filter((i): i is NavItem => !!i);
  const more = [...NAV_ITEMS.filter((i) => !PRIMARY_HREFS.includes(i.href)), ...EXTRA];
  const moreActive = more.some((i) => pathname?.startsWith(i.href));

  // Close the sheet after navigating, and on Escape.
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const itemBase = 'press flex h-11 items-center justify-center gap-1.5 rounded-full font-label-md text-label-md font-bold';
  const pill = (active: boolean) =>
    `${itemBase} transition-[background-color,padding] duration-500 ease-spring ${
      active ? 'bg-accent-lime px-4 text-text-primary' : 'w-11 text-text-muted'
    }`;
  const fill = (active: boolean) =>
    active ? { fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" } : undefined;

  return (
    <>
      <nav
        aria-label="Navigasi utama"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        className="fixed inset-x-3 z-[46] mx-auto flex max-w-sm items-center justify-between rounded-full bg-surface-card/90 p-1.5 shadow-lift ring-1 ring-border-subtle backdrop-blur-xl lg:hidden"
      >
        {primary.map((tab) => {
          const active = !!pathname?.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} aria-current={active ? 'page' : undefined} aria-label={tab.label} className={pill(active)}>
              <span className="material-symbols-outlined text-[22px] leading-none" style={fill(active)}>
                {tab.icon}
              </span>
              {active && <span className="animate-fade-in">{SHORT[tab.href] ?? tab.shortLabel ?? tab.label}</span>}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setSheetOpen((o) => !o)}
          aria-expanded={sheetOpen}
          aria-haspopup="dialog"
          aria-label="Menu lainnya"
          className={pill(moreActive && !sheetOpen)}
        >
          <span
            className="material-symbols-outlined text-[22px] leading-none transition-transform duration-500 ease-spring"
            style={{ transform: sheetOpen ? 'rotate(45deg)' : 'none', ...fill(moreActive) }}
          >
            {sheetOpen ? 'add' : 'apps'}
          </span>
          {moreActive && !sheetOpen && <span className="animate-fade-in">Lainnya</span>}
        </button>
      </nav>

      <div
        className={`fixed inset-0 z-[45] lg:hidden ${sheetOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!sheetOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="Tutup menu"
          onClick={() => setSheetOpen(false)}
          className={`absolute inset-0 bg-black/45 transition-opacity duration-500 ease-spring ${sheetOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          role="dialog"
          aria-label="Menu lainnya"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
          className={`absolute inset-x-0 bottom-0 rounded-t-[32px] bg-surface-card px-space-md pt-3 shadow-lift transition-transform duration-500 ease-spring ${
            sheetOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="mx-auto mb-space-md h-1.5 w-10 rounded-full bg-surface-container-high" aria-hidden="true" />
          <ul className="grid grid-cols-3 gap-space-sm">
            {more.map((item, i) => {
              const active = !!pathname?.startsWith(item.href);
              return (
                <li
                  key={item.href}
                  className={`transition-[opacity,transform] duration-500 ease-spring ${sheetOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                  style={{ transitionDelay: sheetOpen ? `${80 + i * 45}ms` : '0ms' }}
                >
                  <Link
                    href={item.href}
                    tabIndex={sheetOpen ? 0 : -1}
                    className={`press flex h-full flex-col items-center gap-2 rounded-2xl px-2 py-space-md text-center ${
                      active ? 'bg-accent-lime text-text-primary' : 'bg-surface-container-low text-text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[26px]" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="font-label-sm text-label-sm font-semibold leading-tight">{item.shortLabel ?? item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
