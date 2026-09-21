'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { GamificationSummary } from '@/lib/types';
import { Confetti } from '@/components/Confetti';

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
  const [burst, setBurst] = useState(0);

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
        const added = seen ? unlocked.filter((b) => !seen.includes(b.id)) : [];
        if (added.length > 0) {
          setFresh(added);
          setBurst((n) => n + 1);
          navigator.vibrate?.([30, 40, 30]);
        }
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
    <>
    <Confetti burst={burst} originX={85} originY={82} />
    <div className="fixed bottom-28 left-space-md z-50 flex flex-col gap-space-xs lg:bottom-32 lg:left-auto lg:right-space-md" role="status">
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
    </>
  );
}
