'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch, ApiError } from '@/lib/api';
import { Activity, Category, QuickAddDraft } from '@/lib/types';
import { ActivityItem } from '@/components/ActivityItem';

const PALETTE = ['#CCFF00', '#6D3BD7', '#EDE9FE', '#FFEDD5', '#D1FAE5', '#A1A1AA'];

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}j ${m}m`;
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ActivityLogsPage() {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(() => searchParams.get('date') ?? dateToStr(new Date()));
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [exporting, setExporting] = useState(false);

  const [quickText, setQuickText] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [draft, setDraft] = useState<QuickAddDraft | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [acts, cats] = await Promise.all([
        apiFetch<Activity[]>(`/api/activities?date=${selectedDate}`),
        apiFetch<Category[]>('/api/categories'),
      ]);
      setActivities(acts);
      setCategories(cats);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat aktivitas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  function shiftDate(deltaDays: number) {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + deltaDays);
    setSelectedDate(dateToStr(d));
  }

  async function onQuickAdd(e: FormEvent) {
    e.preventDefault();
    if (!quickText.trim()) return;
    setQuickLoading(true);
    setDraft(null);
    try {
      setDraft(
        await apiFetch<QuickAddDraft>('/api/ai/quick-add', {
          method: 'POST',
          body: JSON.stringify({ text: quickText }),
        }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memproses teks.');
    } finally {
      setQuickLoading(false);
    }
  }

  async function confirmDraft() {
    if (!draft) return;
    try {
      const category = categories.find((c) => c.name.toLowerCase() === (draft.category_guess ?? '').toLowerCase());
      await apiFetch('/api/activities', {
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
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan aktivitas.');
    }
  }

  async function onManualSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get('title') ?? ''),
      categoryId: String(form.get('categoryId') ?? '') || undefined,
      startTime: new Date(String(form.get('startTime'))).toISOString(),
      endTime: new Date(String(form.get('endTime'))).toISOString(),
    };
    try {
      if (editingActivity) {
        await apiFetch(`/api/activities/${editingActivity.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/api/activities', { method: 'POST', body: JSON.stringify(payload) });
      }
      setShowManualForm(false);
      setEditingActivity(null);
      (e.target as HTMLFormElement).reset();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan aktivitas.');
    }
  }

  function onStartEdit(a: Activity) {
    setEditingActivity(a);
    setShowManualForm(true);
  }

  function onCancelForm() {
    setShowManualForm(false);
    setEditingActivity(null);
  }

  async function onDelete(id: string) {
    if (!confirm('Hapus log aktivitas ini?')) return;
    try {
      await apiFetch(`/api/activities/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menghapus aktivitas.');
    }
  }

  async function onExportCsv() {
    setExporting(true);
    try {
      const all = await apiFetch<Activity[]>('/api/activities');
      const rows: string[][] = [
        ['Tanggal', 'Judul', 'Kategori', 'Mulai', 'Selesai', 'Durasi (menit)'],
        ...all.map((a) => [
          a.startTime.slice(0, 10),
          a.title,
          a.category?.name ?? '',
          new Date(a.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          new Date(a.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          String(Math.round((new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000)),
        ]),
      ];
      downloadCsv(`continuum-activity-logs-${dateToStr(new Date())}.csv`, rows);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengekspor data.');
    } finally {
      setExporting(false);
    }
  }

  const stats = useMemo(() => {
    const totalMinutes = activities.reduce(
      (sum, a) => sum + (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000,
      0,
    );
    const byCategory = new Map<string, { name: string; minutes: number; color: string | null }>();
    for (const a of activities) {
      const key = a.category?.id ?? 'uncategorized';
      const name = a.category?.name ?? 'Tanpa kategori';
      const minutes = (new Date(a.endTime).getTime() - new Date(a.startTime).getTime()) / 60000;
      const existing = byCategory.get(key);
      if (existing) existing.minutes += minutes;
      else byCategory.set(key, { name, minutes, color: a.category?.color ?? null });
    }
    const distribution = Array.from(byCategory.values()).sort((a, b) => b.minutes - a.minutes);
    const topCategory = distribution[0] ?? null;
    return { totalMinutes, distribution, topCategory };
  }, [activities]);

  const dateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col items-start justify-between gap-space-lg xl:flex-row xl:items-center">
        <div className="flex flex-col gap-space-xs">
          <span className="flex w-fit items-center gap-1 rounded-full bg-accent-lavender px-3 py-1 font-label-sm text-label-sm font-semibold text-accent-lavender-text">
            <span className="material-symbols-outlined text-[15px]">history_toggle_off</span> Activity Logs
          </span>
          <div className="flex items-center gap-space-sm">
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-text-primary">Log Aktivitas</h1>
            <div className="flex items-center gap-1 rounded-full bg-surface-card px-space-sm py-1 shadow-sm">
              <button onClick={() => shiftDate(-1)} className="rounded-full p-1 text-text-secondary hover:bg-surface-container" type="button">
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <span className="px-space-xs font-label-md text-label-md font-semibold text-text-primary">{dateLabel}</span>
              <button onClick={() => shiftDate(1)} className="rounded-full p-1 text-text-secondary hover:bg-surface-container" type="button">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <label className="relative flex items-center rounded-full p-1 text-text-secondary hover:bg-surface-container" title="Lompat ke tanggal (masa lalu atau jauh ke depan)">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>
          </div>
        </div>

        <form onSubmit={onQuickAdd} className="flex w-full items-center gap-1 rounded-full bg-surface-card p-1.5 shadow-md xl:max-w-xl">
          <span className="pl-2 pr-1 text-tertiary">
            <span className="material-symbols-outlined text-[20px]">magic_button</span>
          </span>
          <input
            value={quickText}
            onChange={(e) => setQuickText(e.target.value)}
            placeholder='Ketik alami: "Meeting skripsi jam 14:00 1 jam"...'
            className="flex-1 bg-transparent font-body-md text-body-md text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button
            type="submit"
            disabled={quickLoading}
            className="shrink-0 rounded-full bg-accent-lime px-space-md py-2 font-label-md text-label-md font-semibold text-text-primary hover:bg-accent-lime-dim disabled:opacity-50"
          >
            {quickLoading ? '...' : 'Proses AI'}
          </button>
        </form>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
          {error}{' '}
          <button className="underline" onClick={() => setError(null)}>
            tutup
          </button>
        </div>
      )}

      {draft && (
        <div className="rounded-2xl border border-accent-lavender bg-accent-lavender/20 p-space-md">
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
            <button onClick={confirmDraft} className="rounded-full bg-accent-lime px-space-md py-1.5 font-label-sm text-label-sm font-semibold text-text-primary">
              Konfirmasi &amp; simpan
            </button>
            <button onClick={() => setDraft(null)} className="rounded-full bg-surface-card px-space-md py-1.5 font-label-sm text-label-sm text-text-secondary ring-1 ring-border-subtle">
              Batal
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-lg bg-surface-card p-space-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-medium text-text-secondary">Total Waktu Tercatat</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container">
              <span className="material-symbols-outlined text-[22px]">timer</span>
            </div>
          </div>
          <span className="mt-space-md font-headline-xl text-headline-xl font-bold tracking-tight text-text-primary">
            {formatDuration(stats.totalMinutes)}
          </span>
        </div>

        <div className="flex flex-col justify-between rounded-lg bg-surface-card p-space-lg shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-medium text-text-secondary">Kategori Terbanyak</span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <span className="material-symbols-outlined text-[22px]">category</span>
            </div>
          </div>
          {stats.topCategory ? (
            <div className="mt-space-md flex flex-col">
              <span className="truncate font-headline-sm text-headline-sm font-bold text-text-primary">{stats.topCategory.name}</span>
              <span className="font-body-sm text-body-sm text-text-secondary">{formatDuration(stats.topCategory.minutes)}</span>
            </div>
          ) : (
            <p className="mt-space-md font-body-sm text-body-sm text-text-muted">Belum ada data.</p>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-lg bg-sidebar-dark p-space-lg text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-medium text-text-muted">Jumlah Log</span>
            <span className="material-symbols-outlined text-[22px] text-accent-lime">flash_on</span>
          </div>
          <div className="mt-space-md flex items-end justify-between gap-space-xs">
            <span className="font-headline-xl text-headline-xl font-bold">{activities.length}</span>
            <div className="flex flex-wrap items-center justify-end gap-space-xs">
              <button
                onClick={onExportCsv}
                disabled={exporting}
                title="Ekspor semua aktivitas ke CSV"
                className="flex items-center gap-1 rounded-full bg-sidebar-card px-space-sm py-1.5 font-label-sm text-label-sm font-semibold text-white hover:bg-border-dark-subtle disabled:opacity-50"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                {exporting ? '...' : 'Ekspor CSV'}
              </button>
              <button
                onClick={() => (showManualForm ? onCancelForm() : setShowManualForm(true))}
                className="rounded-full bg-accent-lime px-space-md py-1.5 font-label-sm text-label-sm font-bold text-text-primary hover:bg-accent-lime-dim"
                type="button"
              >
                {showManualForm ? 'Tutup' : '+ Catat manual'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showManualForm && (
        <form
          key={editingActivity?.id ?? 'new'}
          onSubmit={onManualSubmit}
          className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-md shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md font-semibold text-text-primary">
              {editingActivity ? 'Edit aktivitas' : 'Catat aktivitas manual'}
            </span>
            <button onClick={onCancelForm} type="button" className="text-text-muted hover:text-text-primary">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <input
            name="title"
            required
            defaultValue={editingActivity?.title ?? ''}
            placeholder="Judul aktivitas"
            className="w-full rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm"
          />
          <select
            name="categoryId"
            defaultValue={editingActivity?.categoryId ?? ''}
            className="w-full rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm"
          >
            <option value="">Tanpa kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-space-sm">
            <input
              type="datetime-local"
              name="startTime"
              required
              defaultValue={editingActivity ? toDatetimeLocalValue(editingActivity.startTime) : undefined}
              className="w-1/2 rounded-xl border-0 bg-surface-container-low px-space-sm py-space-sm font-body-sm text-body-sm"
            />
            <input
              type="datetime-local"
              name="endTime"
              required
              defaultValue={editingActivity ? toDatetimeLocalValue(editingActivity.endTime) : undefined}
              className="w-1/2 rounded-xl border-0 bg-surface-container-low px-space-sm py-space-sm font-body-sm text-body-sm"
            />
          </div>
          <button type="submit" className="w-full rounded-full bg-accent-lime py-space-sm font-label-md text-label-md font-bold text-text-primary">
            {editingActivity ? 'Simpan perubahan' : 'Simpan aktivitas'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 items-start gap-space-lg xl:grid-cols-12">
        <div className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-sm xl:col-span-8">
          <h2 className="font-headline-md text-headline-md font-bold tracking-tight text-text-primary">Timeline Kronologis</h2>
          {loading ? (
            <p className="text-text-muted">Memuat…</p>
          ) : activities.length === 0 ? (
            <p className="font-body-sm text-body-sm text-text-muted">Belum ada aktivitas tercatat pada tanggal ini.</p>
          ) : (
            <div className="flex flex-col gap-space-xs">
              {activities.map((a) => (
                <div key={a.id} className="group flex items-center gap-space-sm">
                  <div className="min-w-0 flex-1">
                    <ActivityItem
                      title={a.title}
                      startTime={a.startTime}
                      endTime={a.endTime}
                      categoryName={a.category?.name}
                      categoryColor={a.category?.color}
                    />
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => onStartEdit(a)}
                      title="Edit"
                      className="rounded-full p-2 text-text-muted hover:bg-surface-container-low hover:text-text-primary"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button
                      onClick={() => onDelete(a.id)}
                      title="Hapus"
                      className="rounded-full p-2 text-text-muted hover:bg-error-container hover:text-error"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-space-lg xl:col-span-4">
          <div className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-sm">
            <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Distribusi Kategori</h3>
            {stats.distribution.length === 0 ? (
              <p className="font-body-sm text-body-sm text-text-muted">Belum ada aktivitas untuk dianalisis.</p>
            ) : (
              <>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-container">
                  {stats.distribution.map((d, i) => (
                    <div
                      key={d.name}
                      style={{ width: `${(d.minutes / stats.totalMinutes) * 100}%`, backgroundColor: d.color ?? PALETTE[i % PALETTE.length] }}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-space-xs">
                  {stats.distribution.map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between rounded-xl p-2 hover:bg-surface-bright">
                      <div className="flex items-center gap-space-sm">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color ?? PALETTE[i % PALETTE.length] }} />
                        <span className="font-label-md text-label-md font-medium text-text-primary">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-label-md text-label-md font-bold text-text-primary">
                          {Math.round((d.minutes / stats.totalMinutes) * 100)}%
                        </span>
                        <span className="font-caption text-caption text-text-secondary">({formatDuration(d.minutes)})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
