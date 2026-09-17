'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { GoalBreakdown } from '@/lib/types';

interface AiGoalSuggestion {
  monthlyGoals: Array<{ title: string; habits: Array<{ name: string; frequency: string }> }>;
  ai_available: boolean;
  fallback: boolean;
  is_ai_generated: boolean;
}

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [goal, setGoal] = useState<GoalBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<AiGoalSuggestion | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setGoal(await apiFetch<GoalBreakdown>(`/api/goals/${id}/breakdown`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat goal.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function onDelete() {
    if (!confirm('Hapus goal ini? Habit terkait tidak akan terhapus, hanya diputus tautannya.')) return;
    try {
      await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
      router.push('/goals');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus goal.');
    }
  }

  async function onAskAi() {
    if (!goal) return;
    setSuggesting(true);
    try {
      setSuggestion(
        await apiFetch<AiGoalSuggestion>('/api/ai/goal-suggestion', {
          method: 'POST',
          body: JSON.stringify({ yearlyGoalTitle: goal.title }),
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal meminta saran AI.');
    } finally {
      setSuggesting(false);
    }
  }

  if (loading) return <p className="text-text-muted">Memuat…</p>;
  if (!goal) return <p className="text-sm text-error">{error ?? 'Goal tidak ditemukan.'}</p>;

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <span className="font-caption text-caption uppercase tracking-wider text-text-muted">Goal Tahunan</span>
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-text-primary tracking-tight lg:font-headline-xl lg:text-headline-xl">
          {goal.title}
        </h1>
        <span className="w-fit rounded-full bg-accent-mint px-space-sm py-0.5 font-label-sm text-label-sm font-semibold text-accent-mint-text">
          {goal.status}
        </span>
      </div>

      {error && <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>}

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-lg shadow-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Habit Langsung</h2>
          {goal.habits.length === 0 ? (
            <p className="font-body-sm text-body-sm text-text-muted">Belum ada habit langsung di goal ini.</p>
          ) : (
            <ul className="flex flex-col gap-space-xs">
              {goal.habits.map((h) => (
                <li key={h.id} className="flex items-center justify-between rounded-xl bg-surface-container-low px-space-sm py-space-sm">
                  <span className="font-label-md text-label-md text-text-primary">{h.name}</span>
                  <span className="flex items-center gap-1 font-caption text-caption font-semibold text-accent-terracotta-text">
                    <span className="material-symbols-outlined text-[14px]">local_fire_department</span>
                    {h.currentStreak}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-lg shadow-sm">
          <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Goal Bulanan Turunan</h2>
          {goal.childGoals.length === 0 ? (
            <p className="font-body-sm text-body-sm text-text-muted">Belum ada breakdown bulanan.</p>
          ) : (
            <div className="flex flex-col gap-space-sm">
              {goal.childGoals.map((cg) => (
                <div key={cg.id} className="rounded-xl bg-surface-container-low p-space-sm">
                  <p className="font-label-md text-label-md font-semibold text-text-primary">{cg.title}</p>
                  <ul className="mt-1 flex flex-col gap-0.5 font-caption text-caption text-text-secondary">
                    {cg.habits.map((h) => (
                      <li key={h.id}>· {h.name}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-space-sm rounded-2xl bg-gradient-to-r from-surface-card via-tertiary-container/30 to-surface-card p-space-md">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-label-md text-label-md font-bold text-tertiary">
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            Saran Breakdown AI
          </span>
          <button
            onClick={onAskAi}
            disabled={suggesting}
            className="rounded-full bg-accent-lime px-space-md py-1.5 font-label-sm text-label-sm font-semibold text-text-primary disabled:opacity-50"
          >
            {suggesting ? 'Meminta saran…' : '✨ Minta saran'}
          </button>
        </div>

        {suggestion && (
          <div className="flex flex-col gap-space-sm rounded-xl border border-accent-lavender bg-accent-lavender/20 p-space-md">
            <span className={suggestion.is_ai_generated ? 'badge-ai' : 'w-fit rounded-full bg-surface-container px-2 py-0.5 text-xs text-text-secondary'}>
              {suggestion.is_ai_generated ? '✨ AI' : 'Template umum (AI belum tersedia)'}
            </span>
            {suggestion.monthlyGoals.map((mg, i) => (
              <div key={i}>
                <p className="font-label-md text-label-md font-semibold text-text-primary">{mg.title}</p>
                <ul className="font-caption text-caption text-text-secondary">
                  {mg.habits.map((h, j) => (
                    <li key={j}>· {h.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <button onClick={onDelete} className="w-fit font-label-sm text-label-sm text-error underline">
        Hapus goal ini
      </button>
    </div>
  );
}
