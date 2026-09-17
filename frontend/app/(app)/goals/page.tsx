'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import { Goal } from '@/lib/types';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [horizon, setHorizon] = useState<'yearly' | 'monthly'>('yearly');

  async function load() {
    setLoading(true);
    try {
      setGoals(await apiFetch<Goal[]>('/api/goals'));
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat goal.');
    }
  }

  if (loading) return <p className="text-gray-400">Memuat…</p>;

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Goals</h1>
        <button onClick={() => setShowForm((s) => !s)} className="text-sm font-medium text-brand-600">
          {showForm ? 'Tutup' : '+ Goal baru'}
        </button>
      </header>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {showForm && (
        <form onSubmit={onSubmit} className="space-y-2 rounded-xl border border-gray-200 bg-white p-3">
          <input name="title" required placeholder="Judul goal" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          <div className="flex gap-2 text-sm">
            <label className="flex items-center gap-1">
              <input type="radio" checked={horizon === 'yearly'} onChange={() => setHorizon('yearly')} /> Tahunan
            </label>
            <label className="flex items-center gap-1">
              <input type="radio" checked={horizon === 'monthly'} onChange={() => setHorizon('monthly')} /> Bulanan
            </label>
          </div>
          {horizon === 'monthly' && (
            <select name="parentGoalId" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Pilih goal tahunan induk</option>
              {yearlyGoals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.title}
                </option>
              ))}
            </select>
          )}
          <button type="submit" className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white">
            Simpan goal
          </button>
        </form>
      )}

      {goals.length === 0 ? (
        <p className="text-sm text-gray-400">Belum ada goal. Mulai dari goal tahunan.</p>
      ) : (
        <div className="space-y-2">
          {yearlyGoals.map((g) => (
            <Link
              key={g.id}
              href={`/goals/${g.id}`}
              className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <p className="font-medium text-gray-900">{g.title}</p>
              <p className="text-xs text-gray-500">Tahunan · {g.status}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
