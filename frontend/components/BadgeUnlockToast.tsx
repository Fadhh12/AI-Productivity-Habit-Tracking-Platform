'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { GamificationSummary } from '@/lib/types';

const SEEN_KEY = 'continuum_seen_badges';

function readSeen(): string[] | null {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

/** Celebrates newly unlocked badges. The first ever run only records what's already unlocked, so existing users aren't flooded. */
export function BadgeUnlockToast() {
  const pathname = usePathname();
  const [fresh, setFresh] = useState<{ id: string; label: string; icon: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<GamificationSummary>('/api/gamification/summary')
      .then((summary) => {
        if (cancelled) return;
        const unlocked = summary.badges.filter((b) => b.unlocked);
        const seen = readSeen();
        try {
          localStorage.setItem(SEEN_KEY, JSON.stringify(unlocked.map((b) => b.id)));
        } catch {
          // storage unavailable — skip celebration state
        }
        if (seen) setFresh(unlocked.filter((b) => !seen.includes(b.id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (fresh.length === 0) return;
    const t = setTimeout(() => setFresh([]), 6000);
    return () => clearTimeout(t);
  }, [fresh]);

  if (fresh.length === 0) return null;

  return (
    <div className="fixed bottom-24 right-space-md z-50 flex flex-col gap-space-xs lg:bottom-space-xl" role="status">
      {fresh.map((b) => (
        <div key={b.id} className="flex max-w-[calc(100vw-2rem)] animate-slide-up items-center gap-space-sm rounded-2xl bg-sidebar-dark px-space-md py-space-sm text-white shadow-[0_24px_48px_-16px_rgba(22,23,29,0.45)]">
          <span className="material-symbols-outlined rounded-full bg-accent-lime p-1.5 text-[20px] text-text-primary">{b.icon}</span>
          <div className="flex flex-col">
            <span className="font-caption text-caption text-secondary-fixed-dim">Pencapaian baru!</span>
            <span className="font-label-md text-label-md font-bold">{b.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
