'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch, apiFetchQueued, wasQueued, ApiError } from '@/lib/api';
import { useQueueFlushed } from '@/lib/useQueueFlushed';
import { Habit } from '@/lib/types';
import { STREAK_MILESTONES, nextMilestone, unlockedMilestone } from '@/lib/achievements';
import { SkeletonBlock } from '@/components/Skeleton';
import { useConfirm } from '@/lib/confirm';
import { DAY_LABELS_MONDAY_FIRST, last7DatesMonToSun, todayDateString } from '@/lib/date';

const MAX_ACTIVE_HABITS = 5;

function HabitTrackerSkeleton() {
  return (
    <div className="flex flex-col gap-space-lg" role="status" aria-label="Memuat…">
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
        <div className="flex flex-col gap-space-xs">
          <SkeletonBlock className="h-8 w-72" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <SkeletonBlock className="h-11 w-40 rounded-full" />
      </div>

      <SkeletonBlock className="h-32 rounded-2xl" />

      <div className="flex flex-col gap-space-md rounded-2xl bg-surface-card p-space-lg shadow-sm">
        <div className="flex items-center justify-between">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-4 w-24" />
        </div>
        <div className="flex flex-wrap gap-space-sm">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <SkeletonBlock key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

const FREQUENCY_LABEL: Record<string, string> = {
  daily: 'Setiap hari',
  specific_days: 'Hari tertentu',
  weekly_count: 'Beberapa kali/minggu',
};

function weekProgress(habit: Habit, weekDates: string[]) {
  const byDate = new Map((habit.checkins ?? []).map((c) => [c.checkinDate.slice(0, 10), c.status]));
  return weekDates.map((dateStr) => ({ dateStr, status: byDate.get(dateStr) }));
}

export default function HabitTrackerPage() {
  const confirm = useConfirm();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [queuedIds, setQueuedIds] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);

  useQueueFlushed(() => {
    setQueuedIds(new Set());
    load();
  });

  async function load() {
    setLoading(true);
    try {
      setHabits(await apiFetch<Habit[]>('/api/habits'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat habit.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCheckin(habitId: string) {
    setCheckingId(habitId);
    try {
      const result = await apiFetchQueued(`/api/habits/${habitId}/checkin`, { method: 'POST', body: JSON.stringify({}) }, 'checkin');
      if (wasQueued(result)) {
        setQueuedIds((prev) => new Set(prev).add(habitId));
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal check-in habit.');
    } finally {
      setCheckingId(null);
    }
  }

  async function onToggleActive(habit: Habit) {
    try {
      const result = await apiFetch<{ requiresConfirmation?: boolean; message?: string }>(
        `/api/habits/${habit.id}`,
        { method: 'PATCH', body: JSON.stringify({ active: !habit.active }) },
      );
      if (result.requiresConfirmation) {
        if (!(await confirm(`${result.message}\n\nLanjutkan?`))) return;
        await apiFetch(`/api/habits/${habit.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ active: !habit.active, force: true }),
        });
      }
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengubah status habit.');
    }
  }

  async function onDelete(habitId: string) {
    if (!(await confirm('Hapus habit ini beserta riwayat check-in-nya?', { destructive: true, confirmLabel: 'Hapus' })))
      return;
    try {
      await apiFetch(`/api/habits/${habitId}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus habit.');
    }
  }

  async function onCreate(e: FormEvent<HTMLFormElement>, force = false) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') ?? '');
    const frequency = String(form.get('frequency') ?? 'daily');
    try {
      const result = await apiFetch<{ requiresConfirmation?: boolean; message?: string }>('/api/habits', {
        method: 'POST',
        body: JSON.stringify({ name, frequency, force }),
      });
      if (result.requiresConfirmation) {
        if (await confirm(`${result.message}\n\nTambahkan juga?`)) await onCreate(e, true);
        return;
      }
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat habit.');
    }
  }

  if (loading) return <HabitTrackerSkeleton />;

  const activeHabits = habits.filter((h) => h.active);
  const archivedHabits = habits.filter((h) => !h.active);
  const weekDates = last7DatesMonToSun();
  const todayStr = todayDateString();

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
        <div className="flex flex-col gap-space-xs">
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-text-primary tracking-tight lg:font-headline-xl lg:text-headline-xl">
            Habit Tracker &amp; Anti-Burnout
          </h1>
          <p className="font-body-md text-body-md text-text-secondary">
            Maksimal {MAX_ACTIVE_HABITS} habit aktif sekaligus. Hari terlewat tidak pernah menghapus streak secara paksa.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex w-fit items-center gap-2 rounded-full bg-accent-lime px-space-lg py-space-sm font-label-lg text-label-lg font-semibold text-text-primary shadow-sm transition-all hover:scale-[1.02] hover:bg-accent-lime-dim"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          {showForm ? 'Tutup form' : 'Tambah Habit'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
          {error}{' '}
          <button className="underline" onClick={() => setError(null)}>
            tutup
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={onCreate} className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-md shadow-sm md:flex-row md:items-end">
          <input
            name="name"
            required
            maxLength={80}
            placeholder="Nama habit, cth: Baca 20 menit"
            className="flex-1 rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm"
          />
          <select name="frequency" className="rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm">
            <option value="daily">Setiap hari</option>
            <option value="specific_days">Hari tertentu</option>
            <option value="weekly_count">X kali per minggu</option>
          </select>
          <button type="submit" className="rounded-full bg-accent-lime px-space-lg py-space-sm font-label-md text-label-md font-bold text-text-primary">
            Simpan
          </button>
        </form>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-sidebar-dark p-space-lg text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-accent-lime/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-space-sm">
          <span className="w-fit rounded-full bg-accent-lime px-3 py-1 font-label-sm text-label-sm font-bold uppercase tracking-wide text-text-primary">
            Forgiveness Engine Aktif
          </span>
          <h2 className="font-headline-lg text-headline-lg font-bold tracking-tight text-white">
            Konsistensi berkelanjutan tanpa beban psikologis.
          </h2>
          <p className="max-w-xl font-body-md text-body-md text-secondary-fixed-dim">
            Melewatkan satu hari tidak akan pernah menampilkan tanda silang merah. Sistem menandainya sebagai jeda wajar
            selama masih dalam window toleransi.
          </p>
        </div>
      </div>

      {activeHabits.length > 0 && (
        <section className="flex flex-col gap-space-md rounded-2xl bg-surface-card p-space-lg shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-lime text-text-primary">
                <span className="material-symbols-outlined text-[18px]">emoji_events</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Pencapaian Streak</h2>
            </div>
            <span className="font-label-md text-label-md font-semibold text-text-secondary">
              {STREAK_MILESTONES.filter((m) => activeHabits.some((h) => h.currentStreak >= m.days)).length} dari{' '}
              {STREAK_MILESTONES.length} terbuka
            </span>
          </div>
          <div className="flex flex-wrap gap-space-sm">
            {STREAK_MILESTONES.map((m) => {
              const holder = activeHabits.find((h) => h.currentStreak >= m.days);
              const isUnlocked = Boolean(holder);
              return (
                <div
                  key={m.days}
                  title={isUnlocked ? `${m.label} — dicapai oleh "${holder!.name}"` : `${m.label} — capai streak ${m.days} hari`}
                  className={`flex items-center gap-1.5 rounded-full px-space-sm py-1.5 font-label-sm text-label-sm font-semibold ${
                    isUnlocked ? 'bg-accent-lime text-text-primary' : 'bg-surface-container-low text-text-muted'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{isUnlocked ? m.icon : 'lock'}</span>
                  {m.label}
                  <span className="font-caption text-[10px] opacity-70">{m.days}d</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {activeHabits.length === 0 ? (
        <p className="rounded-2xl bg-surface-card p-space-lg text-center font-body-sm text-body-sm text-text-muted shadow-sm">
          Belum ada habit aktif. Mulai dari satu habit kecil yang realistis.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-space-md lg:grid-cols-3">
          {activeHabits.map((h) => {
            const week = weekProgress(h, weekDates);
            const doneCount = week.filter((w) => w.status === 'done').length;
            const pct = Math.round((doneCount / 7) * 100);
            const checkedInToday = week.find((w) => w.dateStr === todayStr)?.status === 'done' || queuedIds.has(h.id);
            const circumference = 2 * Math.PI * 16;
            return (
              <div key={h.id} className="flex flex-col gap-space-md rounded-2xl bg-surface-card p-space-md shadow-sm">
                <div className="flex items-start justify-between gap-space-sm">
                  <div className="flex min-w-0 flex-col">
                    <h3 className="truncate font-headline-sm text-headline-sm font-bold text-text-primary">{h.name}</h3>
                    <span className="truncate font-caption text-caption text-text-secondary">
                      {FREQUENCY_LABEL[h.frequency] ?? h.frequency}
                    </span>
                  </div>
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
                    <svg className="h-11 w-11 -rotate-90 transform" viewBox="0 0 36 36">
                      <circle className="text-surface-container" cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3.5" />
                      <circle
                        className="text-accent-lime"
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3.5"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - (pct / 100) * circumference}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute font-label-sm text-[10px] font-bold text-text-primary">{pct}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {week.map((w) => (
                    <div key={w.dateStr} className="flex flex-col items-center gap-1">
                      <span className="font-caption text-[10px] text-text-muted">
                        {DAY_LABELS_MONDAY_FIRST[weekDates.indexOf(w.dateStr)]}
                      </span>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] ${
                          w.status === 'done'
                            ? 'bg-accent-lime text-text-primary'
                            : w.status === 'missed' || w.status === 'skipped_forgiven'
                              ? 'bg-state-skipped-neutral text-text-muted'
                              : 'bg-surface-container-low text-transparent'
                        }`}
                      >
                        {w.status === 'done' ? '✓' : w.status ? '–' : ''}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-caption text-caption text-text-secondary">
                  {h.currentStreak > 0 && (
                    <span className="flex shrink-0 items-center gap-0.5 whitespace-nowrap font-semibold text-accent-terracotta-text">
                      <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                      {h.currentStreak} streak
                    </span>
                  )}
                  {h.skipCountWindow > 0 && <span className="whitespace-nowrap">{h.skipCountWindow} rest minggu ini</span>}
                </div>

                {(() => {
                  const goal = nextMilestone(h.currentStreak);
                  const badge = unlockedMilestone(h.currentStreak);
                  if (!goal) {
                    return (
                      <div className="flex items-center gap-1.5 font-caption text-caption font-semibold text-accent-mint-text">
                        <span className="material-symbols-outlined text-[14px]">{badge?.icon ?? 'stars'}</span>
                        Semua pencapaian streak terbuka
                      </div>
                    );
                  }
                  const prevDays = badge?.days ?? 0;
                  const span = goal.days - prevDays;
                  const progressed = h.currentStreak - prevDays;
                  const pctToGoal = Math.max(4, Math.round((progressed / span) * 100));
                  return (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between font-caption text-caption text-text-muted">
                        <span>
                          Menuju <span className="font-semibold text-text-secondary">{goal.label}</span>
                        </span>
                        <span className="font-semibold text-text-secondary">
                          {h.currentStreak}/{goal.days}d
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full rounded-full bg-accent-lime" style={{ width: `${pctToGoal}%` }} />
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-space-sm pt-space-xs">
                  <button
                    onClick={() => onCheckin(h.id)}
                    disabled={checkedInToday || checkingId === h.id}
                    className={`flex-1 rounded-full py-space-xs font-label-md text-label-md font-semibold transition-all ${
                      checkedInToday
                        ? 'bg-accent-mint text-accent-mint-text'
                        : 'bg-accent-lime text-text-primary hover:bg-accent-lime-dim disabled:opacity-50'
                    }`}
                  >
                    {checkedInToday ? '✓ Selesai hari ini' : checkingId === h.id ? '...' : 'Tandai selesai'}
                  </button>
                  <button
                    onClick={() => onToggleActive(h)}
                    title="Arsipkan habit"
                    aria-label="Arsipkan habit"
                    className="rounded-full bg-surface-container-low p-2 text-text-secondary hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">archive</span>
                  </button>
                  <button
                    onClick={() => onDelete(h.id)}
                    title="Hapus habit"
                    aria-label="Hapus habit"
                    className="rounded-full bg-surface-container-low p-2 text-error hover:bg-error-container"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {archivedHabits.length > 0 && (
        <section className="flex flex-col gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm text-text-primary">Habit Arsip</h2>
          <div className="flex flex-col gap-space-xs rounded-2xl bg-surface-card p-space-sm shadow-sm">
            {archivedHabits.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-xl p-space-sm hover:bg-surface-container-low">
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md font-medium text-text-secondary">{h.name}</span>
                  <span className="font-caption text-caption text-text-muted">Streak terakhir: {h.currentStreak}</span>
                </div>
                <button
                  onClick={() => onToggleActive(h)}
                  className="rounded-full bg-surface-container-low px-space-md py-1.5 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-accent-lime"
                >
                  Aktifkan lagi
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
