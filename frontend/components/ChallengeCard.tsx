'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useQueueFlushed } from '@/lib/useQueueFlushed';
import { WeeklyChallenge } from '@/lib/types';
import { SkeletonBlock } from '@/components/Skeleton';

const UNIT: Record<WeeklyChallenge['metric'], string> = {
  checkins: 'check-in habit',
  activities: 'aktivitas',
  active_days: 'hari aktif',
};

function rangeLabel(c: WeeklyChallenge): string {
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  return `${fmt(c.weekStart)} – ${fmt(c.weekEnd)}`;
}

/** Loads this week's challenge; refetches when `refreshKey` changes or queued offline check-ins are flushed so progress stays honest. */
export function ChallengeCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    apiFetch<WeeklyChallenge>('/api/challenges/current')
      .then((c) => {
        setChallenge(c);
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshKey]);
  useQueueFlushed(load);

  if (loading) return <SkeletonBlock className="h-40 rounded-2xl" />;
  if (failed || !challenge) return null;

  const done = challenge.status === 'completed';

  return (
    <section
      className={`relative overflow-hidden rounded-2xl p-space-md shadow-soft sm:p-space-lg ${
        done ? 'bg-accent-lime text-text-primary' : 'bg-sidebar-dark text-white'
      }`}
      aria-label="Tantangan mingguan"
    >
      {!done && <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-lime/10 blur-2xl" />}
      <div className="relative flex flex-col gap-space-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
            {done ? 'emoji_events' : 'target'}
          </span>
          <h2 className="font-label-md text-label-md font-bold uppercase tracking-wide">Tantangan Minggu Ini</h2>
          {challenge.is_ai_generated && <span className="badge-ai">✨ AI</span>}
          <span className={`ml-auto font-caption text-caption ${done ? 'text-text-primary/70' : 'text-secondary-fixed-dim'}`}>
            {rangeLabel(challenge)}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="font-headline-sm text-headline-sm font-bold">{challenge.title}</p>
          <p className={`font-body-sm text-body-sm ${done ? 'text-text-primary/80' : 'text-secondary-fixed-dim'}`}>
            {challenge.description}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <div
            className={`h-3 w-full overflow-hidden rounded-full ${done ? 'bg-black/10' : 'bg-sidebar-card'}`}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={challenge.target}
            aria-valuenow={Math.min(challenge.progress, challenge.target)}
            aria-label={`${challenge.progress} dari ${challenge.target} ${UNIT[challenge.metric]}`}
          >
            <div
              className={`h-full origin-left animate-grow-x rounded-full transition-transform duration-700 ease-spring ${done ? 'bg-sidebar-dark' : 'bg-accent-lime'}`}
              style={{ transform: `scaleX(${Math.min(1, Math.max(0, challenge.percent / 100))})` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 font-label-sm text-label-sm">
            <span className="font-semibold">
              {challenge.progress}/{challenge.target} {UNIT[challenge.metric]}
            </span>
            <span className={done ? 'text-text-primary/70' : 'text-secondary-fixed-dim'}>
              {done ? 'Selesai — kerja bagus! 🎉' : `${challenge.daysLeft} hari lagi`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
