'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { GamificationSummary, WeeklyChallenge } from '@/lib/types';
import { ChallengeCard } from '@/components/ChallengeCard';
import { SkeletonBlock } from '@/components/Skeleton';

export default function AchievementsPage() {
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<WeeklyChallenge[]>([]);

  useEffect(() => {
    apiFetch<GamificationSummary>('/api/gamification/summary')
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat pencapaian.'));
    apiFetch<WeeklyChallenge[]>('/api/challenges/history')
      .then(setHistory)
      .catch(() => setHistory([]));
  }, []);

  if (error) return <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>;
  if (!summary) {
    return (
      <div className="flex flex-col gap-space-lg" role="status" aria-label="Memuat…">
        <SkeletonBlock className="h-40 rounded-2xl" />
        <SkeletonBlock className="h-64 rounded-2xl" />
      </div>
    );
  }

  const pct = Math.round((summary.xpIntoLevel / summary.xpForNextLevel) * 100);
  const unlockedCount = summary.badges.filter((b) => b.unlocked).length;

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg text-headline-lg tracking-tight text-text-primary">Pencapaian</h1>
        <p className="font-body-md text-body-md text-text-secondary">
          Progres pribadimu — tanpa peringkat, tanpa hukuman. Hari yang terlewat tidak mengurangi apa pun.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-sidebar-dark p-space-lg text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-accent-lime/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-space-sm">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span className="font-caption text-caption text-secondary-fixed-dim">Level kamu</span>
              <span className="font-headline-xl text-headline-xl font-bold text-accent-lime">{summary.level}</span>
            </div>
            <span className="font-label-md text-label-md text-secondary-fixed-dim">{summary.xp} XP total</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-sidebar-card">
            <div className="h-full rounded-full bg-accent-lime transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-caption text-caption text-secondary-fixed-dim">
            {summary.xpIntoLevel} / {summary.xpForNextLevel} XP menuju level {summary.level + 1}
          </span>
          <span className="font-caption text-caption text-secondary-fixed-dim">
            XP: +10 per checkin, +5 per aktivitas, +15 per refleksi, +100 per goal selesai.
          </span>
        </div>
      </div>

      <ChallengeCard />

      {history.length > 0 && (
        <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-md shadow-sm sm:p-space-lg">
          <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Riwayat Tantangan</h2>
          <ul className="flex flex-col divide-y divide-border-subtle">
            {history.map((c) => (
              <li key={c.id} className="flex items-center gap-space-sm py-space-sm">
                <span
                  className={`material-symbols-outlined flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[20px] ${
                    c.status === 'completed' ? 'bg-accent-lime text-text-primary' : 'bg-surface-container text-text-muted'
                  }`}
                  aria-hidden="true"
                >
                  {c.status === 'completed' ? 'check' : 'remove'}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-label-md text-label-md font-semibold text-text-primary">{c.title}</span>
                  <span className="font-caption text-caption text-text-secondary">
                    {new Date(`${c.weekStart}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ·{' '}
                    {c.progress}/{c.target}
                  </span>
                </div>
                <span className="shrink-0 font-label-sm text-label-sm text-text-muted">
                  {c.status === 'completed' ? 'Selesai' : 'Belum tercapai'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-space-md rounded-2xl bg-surface-card p-space-lg shadow-sm">
        <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">
          Koleksi Lencana ({unlockedCount}/{summary.badges.length})
        </h2>
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2 xl:grid-cols-3">
          {summary.badges.map((b) => (
            <div
              key={b.id}
              className={`flex items-start gap-space-sm rounded-xl p-space-sm ${b.unlocked ? 'bg-surface-container-low' : 'bg-surface-container-low opacity-60'}`}
            >
              <span
                className={`material-symbols-outlined shrink-0 rounded-full p-2 text-[22px] ${
                  b.unlocked ? 'bg-accent-lime text-text-primary' : 'bg-surface-container text-text-muted'
                }`}
              >
                {b.unlocked ? b.icon : 'lock'}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="font-label-md text-label-md font-bold text-text-primary">{b.label}</span>
                <span className="font-caption text-caption text-text-secondary">{b.description}</span>
                {!b.unlocked && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-container">
                      <div className="h-full rounded-full bg-accent-lime" style={{ width: `${(b.progress / b.target) * 100}%` }} />
                    </div>
                    <span className="font-caption text-caption text-text-muted">
                      {b.progress}/{b.target}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
