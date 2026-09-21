'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS } from '@/lib/nav';
import { usePlan } from '@/lib/plan';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function Sidebar() {
  const pathname = usePathname();
  const { isPlus, plan } = usePlan();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setInstallPrompt(null);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function onInstallClick() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setInstallPrompt(null);
  }

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-full w-72 flex-col justify-between bg-sidebar-dark p-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] lg:flex">
      <div className="flex flex-col gap-space-lg">
        <div className="flex items-center gap-space-sm px-space-sm pt-space-xs">
          <div className="flex h-8 w-8 animate-scale-in items-center justify-center rounded-full bg-accent-lime font-headline-md text-headline-md font-bold text-text-primary">
            C
          </div>
          <span className="font-headline-md text-headline-md tracking-tight text-white">Continuum</span>
        </div>
        <nav aria-label="Navigasi utama" className="stagger flex flex-col gap-space-xs px-space-xs">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`press group flex items-center gap-space-md rounded-full px-space-md py-space-sm ${
                  active
                    ? 'bg-accent-lime font-bold text-text-primary shadow-[0_8px_20px_-8px_rgba(204,255,0,0.5)] dark:shadow-none'
                    : 'text-text-muted hover:bg-sidebar-card hover:text-white'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px] transition-transform duration-500 ease-spring group-hover:translate-x-0.5 group-hover:scale-110"
                  style={active ? { fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 24" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="font-label-lg text-label-lg">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-col gap-space-sm">
      <Link
        href="/plus"
        className="press flex items-center gap-space-sm rounded-lg bg-sidebar-card p-space-md text-white hover:bg-border-dark-subtle"
      >
        <span className="material-symbols-outlined flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-lime text-[20px] text-text-primary" aria-hidden="true">
          workspace_premium
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="font-label-md text-label-md font-semibold">Continuum Plus</span>
          <span className="font-caption text-caption text-text-muted">
            {!plan ? 'Memuat…' : isPlus ? 'Aktif' : 'Buka fitur AI penuh'}
          </span>
        </span>
      </Link>
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
          onClick={onInstallClick}
          disabled={!installPrompt || installed}
          className="press mt-space-xs w-full rounded-full bg-sidebar-dark py-space-xs text-center font-label-sm text-label-sm text-white hover:bg-accent-lime hover:text-text-primary disabled:cursor-default disabled:opacity-50 disabled:hover:bg-sidebar-dark disabled:hover:text-white"
          type="button"
        >
          {installed ? 'Terpasang ✓' : installPrompt ? 'Install App' : 'Buka di browser mobile untuk install'}
        </button>
      </div>
      </div>
    </aside>
  );
}
