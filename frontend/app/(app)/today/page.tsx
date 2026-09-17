'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { Activity, Category, Habit, QuickAddDraft } from '@/lib/types';
import { ActivityItem } from '@/components/ActivityItem';
import { HabitCard } from '@/components/HabitCard';

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TodayPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quickText, setQuickText] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [draft, setDraft] = useState<QuickAddDraft | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [showHabitForm, setShowHabitForm] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [acts, hbs, cats] = await Promise.all([
        apiFetch<Activity[]>(`/api/activities?date=${todayDateString()}`),
        apiFetch<Habit[]>('/api/habits'),
        apiFetch<Category[]>('/api/categories'),
      ]);
      setActivities(acts);
      setHabits(hbs.filter((h) => h.active));
      setCategories(cats);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data hari ini.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function onQuickAdd(e: FormEvent) {
    e.preventDefault();
    if (!quickText.trim()) return;
    setQuickLoading(true);
    setDraft(null);
    try {
      const result = await apiFetch<QuickAddDraft>('/api/ai/quick-add', {
        method: 'POST',
        body: JSON.stringify({ text: quickText }),
      });
      setDraft(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memproses teks.');
    } finally {
      setQuickLoading(false);
    }
  }

  async function confirmDraft() {
    if (!draft) return;
    try {
      const category = categories.find(
        (c) => c.name.toLowerCase() === (draft.category_guess ?? '').toLowerCase(),
      );
      await apiFetch<{ data: Activity }>('/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          title: draft.title,
          categoryId: category?.id,
          startTime: draft.start_time,
          endTime: draft.end_time,
        }),
      });
      setDraft(null);
      setQuickText('');
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan aktivitas.');
    }
  }

  async function onManualSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = String(form.get('title') ?? '');
    const startTime = String(form.get('startTime') ?? '');
    const endTime = String(form.get('endTime') ?? '');
    const categoryId = String(form.get('categoryId') ?? '') || undefined;
    try {
      await apiFetch('/api/activities', {
        method: 'POST',
        body: JSON.stringify({
          title,
          categoryId,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
        }),
      });
      setShowManualForm(false);
      (e.target as HTMLFormElement).reset();
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan aktivitas.');
    }
  }

  async function onHabitSubmit(e: FormEvent<HTMLFormElement>, force = false) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get('name') ?? '');
    const frequency = String(form.get('frequency') ?? 'daily');
    try {
      const result = await apiFetch<{ requiresConfirmation?: boolean; message?: string; data?: Habit }>(
        '/api/habits',
        { method: 'POST', body: JSON.stringify({ name, frequency, force }) },
      );
      if (result.requiresConfirmation) {
        if (confirm(`${result.message}\n\nTambahkan juga?`)) {
          await onHabitSubmit(e, true);
        }
        return;
      }
      setShowHabitForm(false);
      (e.target as HTMLFormElement).reset();
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat habit.');
    }
  }

  async function onCheckin(habitId: string) {
    setCheckingId(habitId);
    try {
      const result = await apiFetch<{ data: Habit }>(`/api/habits/${habitId}/checkin`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setHabits((prev) => prev.map((h) => (h.id === habitId ? result.data : h)));
      setCheckedInIds((prev) => new Set(prev).add(habitId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal check-in habit.');
    } finally {
      setCheckingId(null);
    }
  }

  if (loading) return <p className="text-gray-400">Memuat…</p>;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Hari ini</h1>
        <p className="text-sm text-gray-500">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}{' '}
          <button className="underline" onClick={() => setError(null)}>
            tutup
          </button>
        </div>
      )}

      <section>
        <form onSubmit={onQuickAdd} className="flex gap-2">
          <input
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder='cth: "meeting sama dosen jam 2 siang 1 jam"'
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={quickLoading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {quickLoading ? '...' : '✨ AI'}
          </button>
        </form>

        {draft && (
          <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              {draft.is_ai_generated ? (
                <span className="badge-ai">✨ AI</span>
              ) : (
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                  Draft manual (AI belum tersedia)
                </span>
              )}
            </div>
            <p className="font-medium text-gray-900">{draft.title}</p>
            <p className="text-xs text-gray-500">
              {new Date(draft.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}–
              {new Date(draft.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              {draft.category_guess && <span> · {draft.category_guess}</span>}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={confirmDraft}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Konfirmasi & simpan
              </button>
              <button
                onClick={() => setDraft(null)}
                className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-600 ring-1 ring-gray-300"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Habit hari ini</h2>
          <button onClick={() => setShowHabitForm((s) => !s)} className="text-sm font-medium text-brand-600">
            {showHabitForm ? 'Tutup' : '+ Tambah habit'}
          </button>
        </div>

        {showHabitForm && (
          <form onSubmit={onHabitSubmit} className="mb-3 space-y-2 rounded-xl border border-gray-200 bg-white p-3">
            <input
              name="name"
              required
              maxLength={80}
              placeholder="Nama habit, cth: Baca 20 menit"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select name="frequency" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="daily">Setiap hari</option>
              <option value="specific_days">Hari tertentu</option>
              <option value="weekly_count">X kali per minggu</option>
            </select>
            <button type="submit" className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white">
              Simpan habit
            </button>
          </form>
        )}

        {habits.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada habit aktif. Maksimal 5 habit aktif sekaligus (anti-burnout).</p>
        ) : (
          <div className="space-y-2">
            {habits.map((h) => (
              <HabitCard
                key={h.id}
                name={h.name}
                currentStreak={h.currentStreak}
                skipCountWindow={h.skipCountWindow}
                checkedInToday={checkedInIds.has(h.id)}
                checking={checkingId === h.id}
                onCheckin={() => onCheckin(h.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Aktivitas hari ini</h2>
          <button
            onClick={() => setShowManualForm((s) => !s)}
            className="text-sm font-medium text-brand-600"
          >
            {showManualForm ? 'Tutup' : '+ Tambah manual'}
          </button>
        </div>

        {showManualForm && (
          <form onSubmit={onManualSubmit} className="mb-3 space-y-2 rounded-xl border border-gray-200 bg-white p-3">
            <input
              name="title"
              required
              placeholder="Judul aktivitas"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <select name="categoryId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Tanpa kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="datetime-local"
                name="startTime"
                required
                className="w-1/2 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              />
              <input
                type="datetime-local"
                name="endTime"
                required
                className="w-1/2 rounded-lg border border-gray-300 px-2 py-2 text-sm"
              />
            </div>
            <button type="submit" className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white">
              Simpan aktivitas
            </button>
          </form>
        )}

        {activities.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada aktivitas tercatat hari ini.</p>
        ) : (
          <div className="space-y-2">
            {activities.map((a) => (
              <ActivityItem
                key={a.id}
                title={a.title}
                startTime={a.startTime}
                endTime={a.endTime}
                categoryName={a.category?.name}
                categoryColor={a.category?.color}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
