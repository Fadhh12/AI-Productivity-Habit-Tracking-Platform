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

  if (loading) return <p className="text-gray-400">Memuat…</p>;
  if (!goal) return <p className="text-sm text-red-600">{error ?? 'Goal tidak ditemukan.'}</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">{goal.title}</h1>
        <p className="text-sm text-gray-500">Goal tahunan · {goal.status}</p>
      </header>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section>
        <h2 className="mb-2 font-semibold text-gray-800">Habit langsung</h2>
        {goal.habits.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada habit langsung di goal ini.</p>
        ) : (
          <ul className="space-y-1 text-sm text-gray-700">
            {goal.habits.map((h) => (
              <li key={h.id}>• {h.name} (streak {h.currentStreak})</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-gray-800">Goal bulanan turunan</h2>
        {goal.childGoals.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada breakdown bulanan.</p>
        ) : (
          <div className="space-y-2">
            {goal.childGoals.map((cg) => (
              <div key={cg.id} className="rounded-xl border border-gray-200 bg-white p-3">
                <p className="font-medium text-gray-900">{cg.title}</p>
                <ul className="mt-1 space-y-0.5 text-sm text-gray-600">
                  {cg.habits.map((h) => (
                    <li key={h.id}>• {h.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <button
          onClick={onAskAi}
          disabled={suggesting}
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {suggesting ? 'Meminta saran…' : '✨ AI: sarankan breakdown'}
        </button>

        {suggestion && (
          <div className="mt-3 space-y-2 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <span className={suggestion.is_ai_generated ? 'badge-ai' : 'rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600'}>
              {suggestion.is_ai_generated ? '✨ AI' : 'Template umum (AI belum tersedia)'}
            </span>
            {suggestion.monthlyGoals.map((mg, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-gray-800">{mg.title}</p>
                <ul className="text-xs text-gray-600">
                  {mg.habits.map((h, j) => (
                    <li key={j}>· {h.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <button onClick={onDelete} className="text-sm text-red-600 underline">
        Hapus goal ini
      </button>
    </div>
  );
}
