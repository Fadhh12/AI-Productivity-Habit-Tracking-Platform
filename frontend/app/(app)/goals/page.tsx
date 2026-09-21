'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import { Goal, GoalBreakdown } from '@/lib/types';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonBlock } from '@/components/Skeleton';
import { emitMascot, useMascotError } from '@/lib/mascot';

const ICON_STYLES = [
  { bg: 'bg-accent-lavender', text: 'text-accent-lavender-text', icon: 'flag' },
  { bg: 'bg-accent-mint', text: 'text-accent-mint-text', icon: 'rocket_launch' },
  { bg: 'bg-accent-terracotta', text: 'text-accent-terracotta-text', icon: 'bedtime' },
];

function GoalsSkeleton() {
  return (
    <div className="flex flex-col gap-space-lg" role="status" aria-label="Memuat…">
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
        <div className="flex flex-col gap-space-xs">
          <SkeletonBlock className="h-6 w-56 rounded-full" />
          <SkeletonBlock className="mt-1 h-8 w-72 max-w-full" />
          <SkeletonBlock className="h-4 w-80 max-w-full" />
        </div>
        <SkeletonBlock className="h-11 w-40 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <section className="stagger flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-space-xs">
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-24 rounded-2xl" />
          ))}
        </section>

        <section className="stagger flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-space-xs">
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-5 w-16 rounded-full" />
          </div>
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} className="h-20 rounded-2xl" />
          ))}
        </section>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [breakdowns, setBreakdowns] = useState<Record<string, GoalBreakdown>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useMascotError(error);
  const [showForm, setShowForm] = useState(false);
  const [horizon, setHorizon] = useState<'yearly' | 'monthly'>('yearly');

  async function load() {
    setLoading(true);
    try {
      const all = await apiFetch<Goal[]>('/api/goals');
      setGoals(all);
      const yearly = all.filter((g) => g.horizon === 'yearly');
      const pairs = await Promise.all(
        yearly.map(async (g) => [g.id, await apiFetch<GoalBreakdown>(`/api/goals/${g.id}/breakdown`)] as const),
      );
      setBreakdowns(Object.fromEntries(pairs));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat goals.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const yearlyGoals = goals.filter((g) => g.horizon === 'yearly');
  const monthlyGoals = goals.filter((g) => g.horizon === 'monthly');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    try {
      await apiFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: String(form.get('title')),
          horizon,
          parentGoalId: horizon === 'monthly' ? String(form.get('parentGoalId')) || undefined : undefined,
        }),
      });
      setShowForm(false);
      (e.target as HTMLFormElement).reset();
      await load();
      emitMascot('created');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat goal.');
    }
  }

  if (loading) return <GoalsSkeleton />;

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
        <div className="flex flex-col gap-space-xs">
          <span className="flex w-fit items-center gap-1.5 rounded-full bg-accent-lavender px-3 py-1 font-label-sm text-label-sm text-accent-lavender-text shadow-soft">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            AI-Native Decomposition Engine
          </span>
          <h1 className="mt-1 font-headline-xl-mobile text-headline-xl-mobile text-text-primary tracking-tight lg:font-headline-xl lg:text-headline-xl">
            Goals &amp; Horizon Hierarchy
          </h1>
          <p className="font-body-md text-body-md text-text-secondary">
            Goal Tahunan → Goal Bulanan → Habit harian, tanpa beban burnout.
          </p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex w-fit items-center gap-2 rounded-full bg-accent-lime px-space-lg py-space-sm font-label-lg text-label-lg font-semibold text-text-primary press shadow-soft hover:bg-accent-lime-dim"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          {showForm ? 'Tutup form' : 'Goal Baru'}
        </button>
      </div>

      {error && <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>}

      {showForm && (
        <form onSubmit={onSubmit} className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-md shadow-soft">
          <input name="title" required placeholder="Judul goal" className="w-full rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm" />
          <div className="flex gap-space-md font-body-sm text-body-sm">
            <label className="flex items-center gap-1">
              <input type="radio" checked={horizon === 'yearly'} onChange={() => setHorizon('yearly')} /> Tahunan
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={horizon === 'monthly'} onChange={() => setHorizon('monthly')} /> Bulanan
            </label>
          </div>
          {horizon === 'monthly' && (
            <select name="parentGoalId" required className="w-full rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm">
              <option value="">Pilih goal tahunan induk</option>
              {yearlyGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          )}
          <button type="submit" className="w-full rounded-full bg-accent-lime py-space-sm font-label-md text-label-md font-bold text-text-primary">
            Simpan goal
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <section className="stagger flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-space-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-lavender text-accent-lavender-text">
                <span className="material-symbols-outlined text-[16px]">flag</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Goal Tahunan</h2>
            </div>
            <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-medium text-text-secondary">
              {yearlyGoals.length} aktif
            </span>
          </div>

          {yearlyGoals.length === 0 ? (
            <EmptyState icon="flag" mascot="sleepy" title="Belum ada goal" action={{ label: 'Buat goal pertama', onClick: () => setShowForm(true) }}>
              Mulai dari satu goal tahunan. Nanti AI bisa membantu memecahnya jadi target bulanan.
            </EmptyState>
          ) : (
            yearlyGoals.map((g, i) => {
              const style = ICON_STYLES[i % ICON_STYLES.length];
              const bd = breakdowns[g.id];
              return (
                <Link
                  key={g.id}
                  href={`/goals/${g.id}`}
                  className="group flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-md lift"
                >
                  <div className="flex items-start justify-between gap-space-sm">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.bg} ${style.text}`}>
                        <span className="material-symbols-outlined text-[22px]">{style.icon}</span>
                      </div>
                      <div>
                        <h3 className="mt-0.5 font-label-lg text-label-lg font-bold text-text-primary">{g.title}</h3>
                        <span className="font-caption text-caption text-text-secondary">
                          {g.targetDate ? `Target: ${new Date(g.targetDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}` : 'Tanpa target tanggal'}
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-text-muted transition-colors group-hover:text-text-primary">
                      chevron_right
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-subtle/50 pt-space-xs font-label-sm text-label-sm">
                    <span className="flex items-center gap-1 font-medium text-accent-lavender-text">
                      <span className="material-symbols-outlined text-[14px]">link</span>
                      {bd ? `${bd.habits.length} habit langsung · ${bd.childGoals.length} goal bulanan` : '…'}
                    </span>
                    <span className="rounded-full bg-accent-mint px-2 py-0.5 font-caption text-caption font-semibold text-accent-mint-text">
                      {g.status}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </section>

        <section className="stagger flex flex-col gap-space-md">
          <div className="flex items-center justify-between px-space-xs">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-mint text-accent-mint-text">
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
              </div>
              <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Goal Bulanan</h2>
            </div>
            <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-label-sm font-medium text-text-secondary">
              {monthlyGoals.length} aktif
            </span>
          </div>

          {monthlyGoals.length === 0 ? (
            <EmptyState icon="event_note" title="Belum ada target bulanan">
              Buka salah satu goal tahunan untuk meminta saran pecahan bulanan dari AI.
            </EmptyState>
          ) : (
            monthlyGoals.map((g) => {
              const parent = yearlyGoals.find((y) => y.id === g.parentGoalId);
              return (
                <Link
                  key={g.id}
                  href={`/goals/${parent?.id ?? g.id}`}
                  className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-md lift"
                >
                  {parent && (
                    <span className="w-fit rounded-full bg-accent-lavender px-2 py-0.5 font-label-sm text-label-sm font-semibold text-accent-lavender-text">
                      Turunan: {parent.title}
                    </span>
                  )}
                  <h4 className="font-label-lg text-label-lg font-semibold text-text-primary">{g.title}</h4>
                  <div className="flex items-center justify-between font-caption text-caption text-text-muted">
                    <span>{g.targetDate ? new Date(g.targetDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Tanpa target'}</span>
                    <span className="font-semibold text-text-secondary">{g.status}</span>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
