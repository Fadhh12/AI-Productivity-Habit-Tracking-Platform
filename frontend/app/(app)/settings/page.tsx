'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';
import { Activity, Category, Goal, Habit } from '@/lib/types';

const COMMON_TIMEZONES = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'UTC',
];

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  async function onExportData() {
    setExporting(true);
    try {
      const [activities, habits, goals, categories] = await Promise.all([
        apiFetch<Activity[]>('/api/activities'),
        apiFetch<Habit[]>('/api/habits'),
        apiFetch<Goal[]>('/api/goals'),
        apiFetch<Category[]>('/api/categories'),
      ]);
      const payload = { exportedAt: new Date().toISOString(), account: user?.email, activities, habits, goals, categories };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `continuum-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Gagal mengekspor data.');
    } finally {
      setExporting(false);
    }
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify({ timezone }) });
      await refreshUser();
      setMessage('Zona waktu diperbarui. Batas hari (00:00) & reminder menyesuaikan otomatis.');
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-text-primary lg:font-headline-xl lg:text-headline-xl">
          Pengaturan &amp; Preferensi Sistem
        </h1>
        <p className="font-body-md text-body-md text-text-secondary">Kelola akun, zona waktu, dan preferensi AI kamu.</p>
      </div>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <section className="flex flex-col gap-space-md rounded-2xl bg-surface-card p-space-lg shadow-sm">
          <span className="font-headline-sm text-headline-sm text-text-primary">Profil &amp; Akun</span>
          <div className="flex items-center gap-space-md">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-tertiary-container font-headline-sm text-headline-sm font-bold text-on-tertiary-container">
              {user?.email.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg font-bold text-text-primary">{user?.email}</span>
              <span className="font-caption text-caption text-text-secondary">
                Member sejak {user ? new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}
              </span>
            </div>
          </div>
          <button onClick={logout} className="w-fit rounded-full bg-surface-container-low px-space-md py-2 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-surface-container">
            Keluar
          </button>
        </section>

        <form onSubmit={onSave} className="flex flex-col gap-space-md rounded-2xl bg-surface-card p-space-lg shadow-sm">
          <span className="font-headline-sm text-headline-sm text-text-primary">Preferensi Waktu</span>
          <label className="block font-label-md text-label-md font-medium text-text-secondary">Zona waktu</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving}
            className="w-fit rounded-full bg-accent-lime px-space-lg py-space-sm font-label-md text-label-md font-bold text-text-primary hover:bg-accent-lime-dim disabled:opacity-50"
          >
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
          {message && <p className="font-body-sm text-body-sm text-text-secondary">{message}</p>}
        </form>
      </div>

      <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-container-low p-space-lg">
        <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-accent-mint-text">
          <span className="material-symbols-outlined text-[18px]">nature_people</span>
          Mesin Anti-Burnout &amp; Forgiveness
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-text-secondary">
          Continuum membatasi maksimal 5 habit aktif sekaligus dan tidak pernah menghukum hari yang terlewat. Hari
          yang terlewat dalam window toleransi ditandai sebagai jeda wajar, bukan kegagalan — streak tetap terjaga.
        </p>
      </section>

      <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-lg shadow-sm">
        <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-text-primary">
          <span className="material-symbols-outlined text-[18px]">shield</span>
          Data &amp; Privasi
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-text-secondary">
          Semua aktivitas, habit, dan goal kamu tersimpan aman dan hanya dapat diakses oleh akunmu sendiri.
          Menghapus goal atau habit tidak pernah menghapus riwayat aktivitas yang sudah tercatat.
        </p>
        <button
          onClick={onExportData}
          disabled={exporting}
          className="flex w-fit items-center gap-1.5 rounded-full bg-surface-container-low px-space-md py-2 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-surface-container disabled:opacity-50"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">download</span>
          {exporting ? 'Menyiapkan…' : 'Ekspor semua data (JSON)'}
        </button>
      </section>
    </div>
  );
}
