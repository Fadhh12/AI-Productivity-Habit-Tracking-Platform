'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api';
import { Activity, Category, DailyReflection, Goal, Habit } from '@/lib/types';
import { ActivityItem } from '@/components/ActivityItem';
import { HabitCard } from '@/components/HabitCard';
import { Calendar } from '@/components/Calendar';
import { RepeatRule } from '@/lib/recurrence';
import { SkeletonBlock } from '@/components/Skeleton';
import { useConfirm } from '@/lib/confirm';
import { DAY_LABELS_SUNDAY_FIRST, last7Days, todayDateString } from '@/lib/date';
import { useQuickAdd } from '@/lib/quickAdd';
import { createRecurringActivities } from '@/lib/activities';

const MAX_ACTIVE_HABITS = 5;

function TodaySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-12" role="status" aria-label="Memuat…">
      {/* LEFT & CENTER */}
      <div className="flex flex-col gap-space-lg xl:col-span-8">
        <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
          <div className="flex flex-col gap-space-xs">
            <SkeletonBlock className="h-8 w-40" />
            <SkeletonBlock className="h-4 w-64" />
          </div>
          <SkeletonBlock className="h-10 w-48 rounded-full" />
        </div>

        <SkeletonBlock className="h-14 w-full rounded-full" />

        <section className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-6 w-40" />
            <SkeletonBlock className="h-4 w-20" />
          </div>
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <SkeletonBlock key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
          <SkeletonBlock className="h-64 rounded-lg" />
          <SkeletonBlock className="h-64 rounded-lg" />
        </div>
      </div>

      {/* RIGHT RAIL */}
      <div className="flex flex-col gap-space-lg xl:col-span-4">
        <SkeletonBlock className="h-40 rounded-lg" />
        <SkeletonBlock className="h-80 rounded-lg" />
        <div className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-sm">
          <SkeletonBlock className="h-6 w-32" />
          <div className="flex flex-col gap-space-sm">
            {[0, 1, 2].map((i) => (
              <SkeletonBlock key={i} className="h-11 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TodayPage() {
  const confirm = useConfirm();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showHabitForm, setShowHabitForm] = useState(false);

  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [reflectionLoading, setReflectionLoading] = useState(true);
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState(todayDateString());
  const [dayActivities, setDayActivities] = useState<Activity[]>([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleRepeat, setScheduleRepeat] = useState<RepeatRule>('none');

  const { quickText, setQuickText, quickLoading, draft, setDraft, onQuickAdd, confirmDraft } = useQuickAdd({
    categories,
    onSaved: loadAll,
    onError: setError,
  });

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [acts, allActs, hbs, cats, gls] = await Promise.all([
        apiFetch<Activity[]>(`/api/activities?date=${todayDateString()}`),
        apiFetch<Activity[]>('/api/activities'),
        apiFetch<Habit[]>('/api/habits'),
        apiFetch<Category[]>('/api/categories'),
        apiFetch<Goal[]>('/api/goals'),
      ]);
      setActivities(acts);
      setAllActivities(allActs);
      setHabits(hbs.filter((h) => h.active));
      setCategories(cats);
      setGoals(gls.filter((g) => g.horizon === 'yearly'));

      const todayStr = todayDateString();
      const doneToday = hbs
        .filter((h) =>
          (h.checkins ?? []).some((c) => c.checkinDate.slice(0, 10) === todayStr && c.status === 'done'),
        )
        .map((h) => h.id);
      setCheckedInIds(new Set(doneToday));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat data hari ini.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    setReflectionLoading(true);
    apiFetch<DailyReflection>('/api/ai/reflection/today')
      .then((r) => {
        setReflection(r);
        setReflectionText(r.responseText ?? '');
      })
      .catch((err) => setReflectionError(err instanceof ApiError ? err.message : 'Gagal memuat refleksi.'))
      .finally(() => setReflectionLoading(false));
  }, []);

  async function onSaveReflection() {
    setReflectionSaving(true);
    setReflectionError(null);
    try {
      const trimmed = reflectionText.trim();
      const updated = await apiFetch<DailyReflection>('/api/ai/reflection/today', {
        method: 'PATCH',
        body: JSON.stringify({ responseText: trimmed || null }),
      });
      setReflection(updated);
      setReflectionSaved(true);
      setTimeout(() => setReflectionSaved(false), 2000);
    } catch (err) {
      setReflectionError(err instanceof ApiError ? err.message : 'Gagal menyimpan refleksi.');
    } finally {
      setReflectionSaving(false);
    }
  }

  useEffect(() => {
    setDayLoading(true);
    apiFetch<Activity[]>(`/api/activities?date=${selectedDate}`)
      .then(setDayActivities)
      .catch(() => setDayActivities([]))
      .finally(() => setDayLoading(false));
  }, [selectedDate]);

  async function onScheduleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setScheduleError(null);
    const form = new FormData(e.currentTarget);
    const title = String(form.get('title') ?? '');
    const startTimeOfDay = String(form.get('startTime') ?? '');
    const endTimeOfDay = String(form.get('endTime') ?? '');
    const categoryId = String(form.get('categoryId') ?? '') || undefined;
    const repeat = String(form.get('repeat') ?? 'none') as RepeatRule;
    const untilDate = String(form.get('untilDate') ?? '') || undefined;

    try {
      const { occurrenceCount, failCount } = await createRecurringActivities(
        selectedDate,
        repeat,
        untilDate,
        startTimeOfDay,
        endTimeOfDay,
        { title, categoryId },
      );
      (e.target as HTMLFormElement).reset();
      setScheduleRepeat('none');
      setShowScheduleForm(false);
      if (occurrenceCount > 1) {
        setScheduleError(
          failCount > 0
            ? `${occurrenceCount - failCount} dari ${occurrenceCount} jadwal berulang berhasil disimpan.`
            : null,
        );
      }
      const [refreshedDay, refreshedAll] = await Promise.all([
        apiFetch<Activity[]>(`/api/activities?date=${selectedDate}`),
        apiFetch<Activity[]>('/api/activities'),
      ]);
      setDayActivities(refreshedDay);
      setAllActivities(refreshedAll);
    } catch (err) {
      setScheduleError(err instanceof ApiError ? err.message : 'Gagal menjadwalkan aktivitas.');
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
        if (await confirm(`${result.message}\n\nTambahkan juga?`)) {
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

  const weeklyHours = useMemo(() => {
    const days = last7Days();
    return days.map((dateStr) => {
      const minutes = allActivities
        .filter((a) => a.startTime.slice(0, 10) === dateStr)
        .reduce((sum, a) => sum + (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000, 0);
      const d = new Date(dateStr);
      return { dateStr, label: DAY_LABELS_SUNDAY_FIRST[d.getDay()], hours: minutes / 60 };
    });
  }, [allActivities]);

  const maxHours = Math.max(1, ...weeklyHours.map((d) => d.hours));
  const markedDates = useMemo(() => new Set(allActivities.map((a) => a.startTime.slice(0, 10))), [allActivities]);
  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (loading) return <TodaySkeleton />;

  return (
    <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-12">
      {/* LEFT & CENTER */}
      <div className="flex flex-col gap-space-lg xl:col-span-8">
        <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
          <div className="flex flex-col gap-space-xs">
            <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-text-primary tracking-tight lg:font-headline-xl lg:text-headline-xl">
              Halo 👋
            </h1>
            <p className="font-body-md text-body-md text-text-secondary">
              Hari ini ada <span className="font-semibold text-text-primary">{habits.length} habit aktif</span> dan{' '}
              <span className="font-semibold text-text-primary">{activities.length} aktivitas</span> tercatat.
            </p>
          </div>
          <div className="inline-flex items-center gap-space-sm self-start rounded-full bg-surface-card px-space-md py-space-sm shadow-sm md:self-auto">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent-mint-text" />
            <span className="font-label-md text-label-md font-semibold text-text-primary">Kapasitas Habit:</span>
            <span className="rounded-full bg-accent-mint px-space-sm py-0.5 font-label-md text-label-md font-bold text-accent-mint-text">
              {habits.length} / {MAX_ACTIVE_HABITS}
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
            {error}{' '}
            <button className="underline" onClick={() => setError(null)}>
              tutup
            </button>
          </div>
        )}

        <form onSubmit={onQuickAdd} className="flex items-center gap-space-sm rounded-full bg-surface-card p-1.5 pl-space-md shadow-sm">
          <span className="material-symbols-outlined text-[20px] text-tertiary">auto_awesome</span>
          <input
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder='cth: "meeting sama dosen jam 2 siang 1 jam"'
            className="flex-1 bg-transparent font-body-sm text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={quickLoading}
            className="flex items-center gap-1 rounded-full bg-sidebar-dark px-space-md py-space-xs font-label-sm text-label-sm font-semibold text-white transition-all hover:bg-accent-lime hover:text-text-primary disabled:opacity-50"
          >
            {quickLoading ? '...' : 'Catat AI'}
          </button>
        </form>

        {draft && (
          <div className="rounded-2xl border border-accent-lavender bg-accent-lavender/30 p-space-md">
            <span className={draft.is_ai_generated ? 'badge-ai' : 'rounded-full bg-surface-container px-2 py-0.5 text-xs text-text-secondary'}>
              {draft.is_ai_generated ? '✨ AI' : 'Draft manual (AI belum tersedia)'}
            </span>
            <p className="mt-2 font-label-lg text-label-lg font-semibold text-text-primary">{draft.title}</p>
            <p className="font-caption text-caption text-text-muted">
              {new Date(draft.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}–
              {new Date(draft.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              {draft.category_guess && <span> · {draft.category_guess}</span>}
            </p>
            <div className="mt-space-sm flex gap-space-sm">
              <button
                onClick={confirmDraft}
                className="rounded-full bg-accent-lime px-space-md py-1.5 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-accent-lime-dim"
              >
                Konfirmasi &amp; simpan
              </button>
              <button
                onClick={() => setDraft(null)}
                className="rounded-full bg-surface-card px-space-md py-1.5 font-label-sm text-label-sm font-medium text-text-secondary ring-1 ring-border-subtle"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        <section className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <h2 className="font-headline-sm text-headline-sm text-text-primary">Habit Aktif Hari Ini</h2>
              <span className="rounded-full bg-accent-lavender px-space-sm py-0.5 font-label-sm text-label-sm font-semibold text-accent-lavender-text">
                {habits.length} habit
              </span>
            </div>
            <Link href="/habit-tracker" className="font-label-sm text-label-sm font-semibold text-text-muted hover:text-text-primary">
              Lihat semua
            </Link>
          </div>

          {habits.length === 0 ? (
            <div className="rounded-2xl bg-surface-card p-space-md shadow-sm">
              <p className="font-body-sm text-body-sm text-text-muted">
                Belum ada habit aktif. Maksimal {MAX_ACTIVE_HABITS} habit aktif sekaligus (anti-burnout).
              </p>
              <button
                onClick={() => setShowHabitForm((s) => !s)}
                className="mt-space-sm font-label-sm text-label-sm font-semibold text-primary"
              >
                {showHabitForm ? 'Tutup' : '+ Tambah habit'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
              {habits.slice(0, 3).map((h) => (
                <HabitCard
                  key={h.id}
                  name={h.name}
                  frequency={h.frequency}
                  currentStreak={h.currentStreak}
                  skipCountWindow={h.skipCountWindow}
                  checkedInToday={checkedInIds.has(h.id)}
                  checking={checkingId === h.id}
                  onCheckin={() => onCheckin(h.id)}
                />
              ))}
            </div>
          )}

          {showHabitForm && (
            <form onSubmit={onHabitSubmit} className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-md shadow-sm">
              <input
                name="name"
                required
                maxLength={80}
                placeholder="Nama habit, cth: Baca 20 menit"
                className="w-full rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm"
              />
              <select name="frequency" className="w-full rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm">
                <option value="daily">Setiap hari</option>
                <option value="specific_days">Hari tertentu</option>
                <option value="weekly_count">X kali per minggu</option>
              </select>
              <button type="submit" className="w-full rounded-full bg-accent-lime py-space-sm font-label-md text-label-md font-bold text-text-primary">
                Simpan habit
              </button>
            </form>
          )}
        </section>

        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-lg bg-surface-card p-space-lg shadow-sm">
            <div className="mb-space-sm flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-headline-sm text-text-primary">Jam Aktivitas</h3>
                <p className="font-caption text-caption text-text-muted">7 hari terakhir</p>
              </div>
            </div>
            <div className="flex h-44 items-end justify-between px-space-xs pt-space-lg">
              {weeklyHours.map((d) => {
                const isToday = d.dateStr === todayDateString();
                const heightPct = Math.max(4, (d.hours / maxHours) * 100);
                return (
                  <div key={d.dateStr} className="flex h-full flex-1 flex-col items-center justify-end gap-space-xs">
                    <div
                      className={`w-2.5 rounded-t-full md:w-3 ${isToday ? 'bg-accent-lime shadow-[0_0_12px_rgba(204,255,0,0.5)]' : 'bg-sidebar-dark'}`}
                      style={{ height: `${heightPct}%` }}
                      title={`${d.hours.toFixed(1)} jam`}
                    />
                    <span className={`font-caption text-caption ${isToday ? 'font-bold text-text-primary' : 'text-text-muted'}`}>
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-space-sm rounded-lg bg-surface-card p-space-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-text-primary">Jadwal Hari Ini</h3>
              <span className="font-label-sm text-label-sm font-medium text-text-muted">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>
            {activities.length === 0 ? (
              <p className="font-body-sm text-body-sm text-text-muted">Belum ada aktivitas tercatat hari ini.</p>
            ) : (
              <div className="flex flex-col gap-space-xs">
                {activities.slice(0, 4).map((a) => (
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
            <Link href="/activity-logs" className="font-label-sm text-label-sm font-semibold text-tertiary hover:underline">
              Lihat semua aktivitas →
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT RAIL */}
      <div className="flex flex-col gap-space-lg xl:col-span-4">
        <div className="flex flex-col gap-space-sm rounded-lg bg-sidebar-dark p-space-lg text-white shadow-md">
          <div className="flex items-center gap-1 text-accent-lime">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span className="font-label-sm text-label-sm font-bold uppercase tracking-wider">AI Digest</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm font-bold text-white">Rangkuman AI bulan ini sudah siap.</h3>
          <p className="font-body-sm text-body-sm text-text-muted">
            Lihat pola konsistensi, distribusi kategori, dan saran ritme sehat dari AI Continuum.
          </p>
          <Link
            href="/reports"
            className="mt-space-xs inline-flex w-fit items-center gap-1 rounded-full bg-accent-lime px-space-lg py-space-xs font-label-md text-label-md font-bold text-text-primary hover:bg-accent-lime-dim"
          >
            Buka Digest
          </Link>
        </div>

        <div className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-sm">
          <Calendar markedDates={markedDates} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

          <div className="flex flex-col gap-space-sm border-t border-border-subtle pt-space-sm">
            <div className="flex items-center justify-between gap-space-sm">
              <span className="min-w-0 truncate font-label-md text-label-md font-semibold text-text-primary" title={selectedDateLabel}>
                {selectedDateLabel}
              </span>
              <button
                onClick={() => setShowScheduleForm((s) => !s)}
                className="flex shrink-0 items-center gap-1 rounded-full bg-surface-container-low px-space-sm py-1 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-accent-lime"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Jadwalkan
              </button>
            </div>

            {showScheduleForm && (
              <form onSubmit={onScheduleSubmit} className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-sm">
                <input
                  name="title"
                  required
                  placeholder="Judul aktivitas"
                  className="w-full rounded-lg border-0 bg-surface-card px-space-sm py-1.5 font-body-sm text-body-sm"
                />
                <select name="categoryId" className="w-full rounded-lg border-0 bg-surface-card px-space-sm py-1.5 font-body-sm text-body-sm">
                  <option value="">Tanpa kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-space-xs">
                  <input type="time" name="startTime" required className="w-1/2 rounded-lg border-0 bg-surface-card px-space-sm py-1.5 font-body-sm text-body-sm" />
                  <input type="time" name="endTime" required className="w-1/2 rounded-lg border-0 bg-surface-card px-space-sm py-1.5 font-body-sm text-body-sm" />
                </div>
                <div className="flex gap-space-xs">
                  <select
                    name="repeat"
                    value={scheduleRepeat}
                    onChange={(e) => setScheduleRepeat(e.target.value as RepeatRule)}
                    className="w-1/2 rounded-lg border-0 bg-surface-card px-space-sm py-1.5 font-body-sm text-body-sm"
                  >
                    <option value="none">Sekali saja</option>
                    <option value="daily">Ulangi setiap hari</option>
                    <option value="weekdays">Ulangi hari kerja (Sen–Jum)</option>
                    <option value="weekly">Ulangi tiap minggu (hari sama)</option>
                  </select>
                  {scheduleRepeat !== 'none' && (
                    <input
                      type="date"
                      name="untilDate"
                      required
                      min={selectedDate}
                      title="Ulangi sampai tanggal"
                      className="w-1/2 rounded-lg border-0 bg-surface-card px-space-sm py-1.5 font-body-sm text-body-sm"
                    />
                  )}
                </div>
                {scheduleError && <p className="font-caption text-caption text-error">{scheduleError}</p>}
                <button type="submit" className="w-full rounded-full bg-accent-lime py-1.5 font-label-sm text-label-sm font-bold text-text-primary">
                  Simpan jadwal
                </button>
              </form>
            )}

            {dayLoading ? (
              <p className="font-caption text-caption text-text-muted">Memuat…</p>
            ) : dayActivities.length === 0 ? (
              <p className="font-caption text-caption text-text-muted">Belum ada jadwal di tanggal ini.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {dayActivities.map((a) => (
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
          </div>
        </div>

        <div className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-headline-sm text-text-primary">Horizon Goals</h3>
            <Link
              href="/goals"
              aria-label="Tambah goal baru"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-container text-text-primary hover:bg-accent-lime"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            </Link>
          </div>
          {goals.length === 0 ? (
            <p className="font-body-sm text-body-sm text-text-muted">Belum ada goal tahunan.</p>
          ) : (
            <div className="flex flex-col gap-space-sm">
              {goals.slice(0, 4).map((g) => (
                <Link
                  key={g.id}
                  href={`/goals/${g.id}`}
                  className="flex items-center justify-between rounded-xl bg-surface-container-low p-space-sm transition-colors hover:bg-surface-container"
                >
                  <span className="font-label-md text-label-md font-semibold text-text-primary">{g.title}</span>
                  <span className="rounded-full bg-accent-lavender px-space-sm py-0.5 font-caption text-caption font-bold text-accent-lavender-text">
                    {g.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-space-sm rounded-lg bg-surface-card p-space-lg shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-tertiary">self_improvement</span>
            <h3 className="font-headline-sm text-headline-sm text-text-primary">Refleksi Hari Ini</h3>
          </div>

          {reflectionLoading ? (
            <SkeletonBlock className="h-16 rounded-xl" />
          ) : reflection ? (
            <>
              <span
                className={
                  reflection.is_ai_generated
                    ? 'badge-ai w-fit'
                    : 'w-fit rounded-full bg-surface-container px-2 py-0.5 text-xs text-text-secondary'
                }
              >
                {reflection.is_ai_generated ? '✨ AI' : 'Pertanyaan default (AI belum tersedia)'}
              </span>
              <p className="font-body-sm text-body-sm font-medium text-text-primary">{reflection.prompt}</p>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tulis 1 kalimat refleksi kamu…"
                className="w-full resize-none rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-sidebar-dark"
              />
              <div className="flex items-center justify-between gap-space-sm">
                <span className="font-caption text-caption text-text-muted">{reflectionText.length}/500</span>
                <button
                  onClick={onSaveReflection}
                  disabled={reflectionSaving}
                  className="rounded-full bg-accent-lime px-space-md py-1.5 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-accent-lime-dim disabled:opacity-50"
                >
                  {reflectionSaving ? 'Menyimpan…' : reflectionSaved ? '✓ Tersimpan' : 'Simpan'}
                </button>
              </div>
              {reflectionError && <p className="font-caption text-caption text-error">{reflectionError}</p>}
            </>
          ) : (
            <p className="font-body-sm text-body-sm text-text-muted">{reflectionError ?? 'Belum ada refleksi hari ini.'}</p>
          )}
        </div>
      </div>
    </div>
  );
}
