'use client';

import { Mascot, MascotMood } from '@/components/Mascot';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';
import { Goal } from '@/lib/types';

const MAX_ACTIVE_HABITS = 5;

const FREQUENCY_LABEL: Record<string, string> = {
  daily: 'Setiap hari',
  specific_days: 'Hari tertentu',
  weekly_count: 'Beberapa kali/minggu',
};

interface AiGoalSuggestion {
  monthlyGoals: Array<{ title: string; habits: Array<{ name: string; frequency: string }> }>;
  ai_available: boolean;
  fallback: boolean;
  is_ai_generated: boolean;
}

interface HabitDraft {
  name: string;
  frequency: string;
  checked: boolean;
}

function dedupeHabits(suggestion: AiGoalSuggestion): HabitDraft[] {
  const seen = new Set<string>();
  const drafts: HabitDraft[] = [];
  for (const mg of suggestion.monthlyGoals) {
    for (const h of mg.habits) {
      const key = h.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      drafts.push({ name: h.name, frequency: h.frequency, checked: drafts.length < MAX_ACTIVE_HABITS });
    }
  }
  return drafts;
}

const STEP_LINES: Record<number, string> = {
  1: 'Aku Conti. Yuk kenalan dulu.',
  2: 'Pilih yang terasa ringan saja.',
  3: 'Tinggal satu langkah lagi.',
};

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goalTitle, setGoalTitle] = useState('');
  const [suggestion, setSuggestion] = useState<AiGoalSuggestion | null>(null);
  const [habits, setHabits] = useState<HabitDraft[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [customFrequency, setCustomFrequency] = useState('daily');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  const checkedCount = habits.filter((h) => h.checked).length;

  async function onGoalSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const title = goalTitle.trim();
    if (!title) {
      setHabits([]);
      setStep(3);
      return;
    }
    setLoadingAi(true);
    try {
      const result = await apiFetch<AiGoalSuggestion>('/api/ai/goal-suggestion', {
        method: 'POST',
        body: JSON.stringify({ yearlyGoalTitle: title }),
      });
      setSuggestion(result);
      setHabits(dedupeHabits(result));
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal meminta saran AI. Kamu bisa lanjut tanpa saran.');
      setHabits([]);
      setStep(3);
    } finally {
      setLoadingAi(false);
    }
  }

  function toggleHabit(index: number) {
    setHabits((prev) =>
      prev.map((h, i) => {
        if (i !== index) return h;
        if (!h.checked && checkedCount >= MAX_ACTIVE_HABITS) return h;
        return { ...h, checked: !h.checked };
      }),
    );
  }

  function addCustomHabit(e: FormEvent) {
    e.preventDefault();
    const name = customName.trim();
    if (!name || checkedCount >= MAX_ACTIVE_HABITS) return;
    setHabits((prev) => [...prev, { name, frequency: customFrequency, checked: true }]);
    setCustomName('');
  }

  async function onFinish() {
    setError(null);
    setSubmitting(true);
    try {
      let goalId: string | undefined;
      const title = goalTitle.trim();
      if (title) {
        const goal = await apiFetch<Goal>('/api/goals', {
          method: 'POST',
          body: JSON.stringify({ title, horizon: 'yearly' }),
        });
        goalId = goal.id;
      }
      const selected = habits.filter((h) => h.checked);
      for (const h of selected) {
        await apiFetch('/api/habits', {
          method: 'POST',
          body: JSON.stringify({ name: h.name, frequency: h.frequency, goalId }),
        });
      }
      router.replace('/today');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  const mascotMood: MascotMood = error ? 'oops' : loadingAi || submitting ? 'thinking' : step === 3 ? 'cheer' : 'happy';

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-canvas-bg text-text-muted">Memuat…</div>
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-canvas-bg px-space-md py-10 sm:py-14">
      <div className="w-full max-w-lg">
        <div className="mb-space-lg flex flex-col items-center gap-1">
          <Mascot mood={mascotMood} interactive className="force-light w-28" />
          <p key={step} className="animate-fade-up text-center font-label-md text-label-md text-text-secondary">
            {STEP_LINES[step] ?? ''}
          </p>
        </div>

        <div className="mb-space-lg flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`h-1.5 rounded-full transition-[width,background-color] duration-500 ease-spring ${
                s === step ? 'w-8 bg-accent-lime' : s < step ? 'w-4 bg-accent-lime/60' : 'w-4 bg-surface-container'
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="mb-space-md rounded-lg bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="animate-slide-up rounded-2xl bg-surface-card p-space-lg shadow-soft">
            <h1 className="font-headline-sm text-headline-sm font-bold text-text-primary">
              Ada target besar tahun ini?
            </h1>
            <p className="mt-1 font-body-sm text-body-sm text-text-secondary">
              Opsional. Isi kalau mau AI bantu breakdown jadi habit harian. Bisa dilewati kapan saja.
            </p>
            <form onSubmit={onGoalSubmit} className="mt-space-lg flex flex-col gap-space-md">
              <input
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                maxLength={150}
                placeholder="cth: Sehat & bugar sepanjang tahun"
                className="w-full rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-sidebar-dark"
              />
              <div className="flex flex-col gap-space-sm sm:flex-row">
                <button
                  type="submit"
                  disabled={loadingAi}
                  className="order-2 w-full rounded-full bg-accent-lime py-space-sm font-label-lg text-label-lg font-bold text-text-primary press hover:bg-accent-lime-dim disabled:opacity-50 sm:order-1 sm:flex-1"
                >
                  {loadingAi ? 'Meminta saran AI…' : goalTitle.trim() ? 'Lanjut, minta saran AI' : 'Lanjut'}
                </button>
                {goalTitle.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setGoalTitle('');
                      setHabits([]);
                      setStep(3);
                    }}
                    className="order-1 w-full rounded-full bg-surface-container-low py-space-sm font-label-lg text-label-lg font-semibold text-text-secondary sm:order-2 sm:w-auto sm:px-space-md"
                  >
                    Lewati
                  </button>
                )}
              </div>
              {!goalTitle.trim() && (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="w-full text-center font-label-sm text-label-sm font-semibold text-text-muted hover:text-text-primary"
                >
                  Lewati, langsung ke pilih habit
                </button>
              )}
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-space-md animate-slide-up rounded-2xl bg-surface-card p-space-lg shadow-soft">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-tertiary">psychology</span>
              <h1 className="font-headline-sm text-headline-sm font-bold text-text-primary">Draft rencana dari AI</h1>
            </div>
            {suggestion && (
              <span className={suggestion.is_ai_generated ? 'badge-ai w-fit' : 'w-fit rounded-full bg-surface-container px-2 py-0.5 text-xs text-text-secondary'}>
                {suggestion.is_ai_generated ? '✨ AI' : 'Template umum (AI belum tersedia)'}
              </span>
            )}
            <p className="font-body-sm text-body-sm text-text-secondary">
              Untuk goal &ldquo;{goalTitle.trim()}&rdquo;. Kamu masih bisa pilih habit mana saja di langkah berikutnya.
            </p>
            <div className="flex flex-col gap-space-sm">
              {suggestion?.monthlyGoals.map((mg, i) => (
                <div key={i} className="rounded-xl bg-surface-container-low p-space-sm">
                  <p className="font-label-md text-label-md font-semibold text-text-primary">{mg.title}</p>
                  <ul className="mt-1 flex flex-col gap-0.5 font-caption text-caption text-text-secondary">
                    {mg.habits.map((h, j) => (
                      <li key={j}>
                        · {h.name} <span className="text-text-muted">({FREQUENCY_LABEL[h.frequency] ?? h.frequency})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(3)}
              className="w-full rounded-full bg-accent-lime py-space-sm font-label-lg text-label-lg font-bold text-text-primary press hover:bg-accent-lime-dim"
            >
              Lanjut, pilih habit
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-space-md animate-slide-up rounded-2xl bg-surface-card p-space-lg shadow-soft">
            <h1 className="font-headline-sm text-headline-sm font-bold text-text-primary">Pilih habit aktif pertama</h1>
            <p className="font-body-sm text-body-sm text-text-secondary">
              Maksimal {MAX_ACTIVE_HABITS} habit sekaligus (anti-burnout). Dipilih: {checkedCount}/{MAX_ACTIVE_HABITS}.
            </p>

            {habits.length === 0 ? (
              <p className="rounded-xl bg-surface-container-low p-space-md font-body-sm text-body-sm text-text-muted">
                Belum ada saran habit. Tambahkan habit pertamamu di bawah.
              </p>
            ) : (
              <ul className="flex flex-col gap-space-xs">
                {habits.map((h, i) => (
                  <li key={`${h.name}-${i}`}>
                    <label
                      className={`flex cursor-pointer items-center justify-between gap-space-sm press rounded-xl px-space-md py-space-sm ${
                        h.checked ? 'bg-accent-lime/10 ring-1 ring-accent-lime' : 'bg-surface-container-low'
                      } ${!h.checked && checkedCount >= MAX_ACTIVE_HABITS ? 'opacity-50' : ''}`}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-label-md text-label-md font-semibold text-text-primary">{h.name}</span>
                        <span className="font-caption text-caption text-text-muted">{FREQUENCY_LABEL[h.frequency] ?? h.frequency}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={h.checked}
                        disabled={!h.checked && checkedCount >= MAX_ACTIVE_HABITS}
                        onChange={() => toggleHabit(i)}
                        className="h-5 w-5 shrink-0 accent-accent-lime-dim"
                      />
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <form onSubmit={addCustomHabit} className="flex flex-col gap-space-sm rounded-xl bg-surface-container-low p-space-sm sm:flex-row sm:items-center">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={80}
                placeholder="Tambah habit lain, cth: Minum air 2L"
                disabled={checkedCount >= MAX_ACTIVE_HABITS}
                className="w-full rounded-xl border-0 bg-surface-card px-space-md py-space-sm font-body-sm text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-sidebar-dark disabled:opacity-50 sm:flex-1"
              />
              <select
                value={customFrequency}
                onChange={(e) => setCustomFrequency(e.target.value)}
                disabled={checkedCount >= MAX_ACTIVE_HABITS}
                className="w-full rounded-xl border-0 bg-surface-card px-space-md py-space-sm font-body-sm text-body-sm disabled:opacity-50 sm:w-auto"
              >
                <option value="daily">Setiap hari</option>
                <option value="specific_days">Hari tertentu</option>
                <option value="weekly_count">Beberapa kali/minggu</option>
              </select>
              <button
                type="submit"
                disabled={!customName.trim() || checkedCount >= MAX_ACTIVE_HABITS}
                className="w-full shrink-0 rounded-full bg-surface-card px-space-md py-space-sm font-label-sm text-label-sm font-semibold text-text-primary ring-1 ring-border-subtle disabled:opacity-50 sm:w-auto"
              >
                + Tambah
              </button>
            </form>

            <div className="flex flex-col gap-space-sm sm:flex-row">
              <button
                onClick={onFinish}
                disabled={submitting || checkedCount === 0}
                className="w-full rounded-full bg-accent-lime py-space-sm font-label-lg text-label-lg font-bold text-text-primary press hover:bg-accent-lime-dim disabled:opacity-50"
              >
                {submitting ? 'Menyiapkan…' : `Mulai dengan ${checkedCount} habit`}
              </button>
              {checkedCount === 0 && (
                <button
                  onClick={() => router.replace('/today')}
                  disabled={submitting}
                  className="w-full shrink-0 rounded-full bg-surface-container-low py-space-sm font-label-lg text-label-lg font-semibold text-text-secondary disabled:opacity-50 sm:w-auto sm:px-space-md"
                >
                  Lewati semua
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
