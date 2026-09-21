'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePlan } from '@/lib/plan';
import { Avatar } from '@/components/Avatar';
import { apiFetch, ApiError } from '@/lib/api';
import { Activity, Category, Goal, Habit } from '@/lib/types';
import { disablePush, enablePush, getPushState, PushState, sendTestPush } from '@/lib/push';

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

interface CalendarStatus {
  available: boolean;
  connected: boolean;
  lastSyncedAt: string | null;
}

export default function SettingsPage() {
  const { isPlus } = usePlan();
  const { user, logout, refreshUser } = useAuth();
  const [calendar, setCalendar] = useState<CalendarStatus | null>(null);
  const [calendarBusy, setCalendarBusy] = useState(false);
  const [calendarMessage, setCalendarMessage] = useState<string | null>(null);

  async function loadCalendarStatus() {
    try {
      setCalendar(await apiFetch<CalendarStatus>('/api/calendar/google/status'));
    } catch {
      // Card stays hidden-state; rest of settings unaffected.
    }
  }

  useEffect(() => {
    loadCalendarStatus();
    const result = new URLSearchParams(window.location.search).get('calendar');
    if (result === 'connected') setCalendarMessage('Google Calendar berhasil terhubung.');
    if (result === 'error') setCalendarMessage('Gagal menghubungkan Google Calendar. Coba lagi.');
  }, []);

  async function onConnectCalendar() {
    setCalendarBusy(true);
    try {
      const res = await apiFetch<{ available: boolean; url?: string }>('/api/calendar/google/auth-url');
      if (res.available && res.url) {
        window.location.href = res.url;
        return;
      }
      setCalendarMessage('Integrasi Google Calendar belum dikonfigurasi di server.');
    } catch (err) {
      setCalendarMessage(err instanceof ApiError ? err.message : 'Gagal memulai koneksi.');
    } finally {
      setCalendarBusy(false);
    }
  }

  async function onSyncCalendar() {
    setCalendarBusy(true);
    try {
      const res = await apiFetch<{ imported: number; total: number }>('/api/calendar/google/sync', { method: 'POST' });
      setCalendarMessage(`${res.imported} dari ${res.total} event diimpor sebagai aktivitas.`);
      await loadCalendarStatus();
    } catch (err) {
      setCalendarMessage(err instanceof ApiError ? err.message : 'Gagal sinkronisasi.');
    } finally {
      setCalendarBusy(false);
    }
  }

  async function onDisconnectCalendar() {
    setCalendarBusy(true);
    try {
      await apiFetch('/api/calendar/google', { method: 'DELETE' });
      setCalendarMessage('Google Calendar diputus. Aktivitas yang sudah diimpor tetap tersimpan.');
      await loadCalendarStatus();
    } catch (err) {
      setCalendarMessage(err instanceof ApiError ? err.message : 'Gagal memutus koneksi.');
    } finally {
      setCalendarBusy(false);
    }
  }

  const [timezone, setTimezone] = useState(user?.timezone ?? 'UTC');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [insightsSaving, setInsightsSaving] = useState(false);
  const [pushState, setPushState] = useState<PushState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMessage, setPushMessage] = useState<string | null>(null);

  useEffect(() => {
    getPushState().then(setPushState).catch(() => setPushState('unsupported'));
  }, []);

  async function onTogglePush() {
    setPushBusy(true);
    setPushMessage(null);
    try {
      setPushState(pushState === 'on' ? await disablePush() : await enablePush());
    } catch (err) {
      setPushMessage(err instanceof ApiError ? err.message : 'Gagal mengubah notifikasi push di perangkat ini.');
    } finally {
      setPushBusy(false);
    }
  }

  async function onTestPush() {
    setPushBusy(true);
    try {
      const delivered = await sendTestPush();
      setPushMessage(delivered > 0 ? 'Tes dikirim. Notifikasi akan muncul sebentar lagi.' : 'Tidak ada perangkat terdaftar untuk menerima tes.');
    } catch (err) {
      setPushMessage(err instanceof ApiError ? err.message : 'Gagal mengirim tes.');
    } finally {
      setPushBusy(false);
    }
  }
  const insightsOn = user?.proactiveInsights ?? true;

  async function onToggleInsights() {
    setInsightsSaving(true);
    try {
      await apiFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify({ proactiveInsights: !insightsOn }) });
      await refreshUser();
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : 'Gagal menyimpan preferensi.');
    } finally {
      setInsightsSaving(false);
    }
  }

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
    <div className="stagger flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-text-primary lg:font-headline-xl lg:text-headline-xl">
          Pengaturan &amp; Preferensi Sistem
        </h1>
        <p className="font-body-md text-body-md text-text-secondary">Kelola akun, zona waktu, dan preferensi AI kamu.</p>
      </div>

      <Link
        href="/plus"
        className="flex items-center gap-space-md rounded-2xl bg-sidebar-dark p-space-md text-white shadow-soft"
      >
        <span className="material-symbols-outlined flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-lime text-[24px] text-text-primary" aria-hidden="true">
          workspace_premium
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="font-label-lg text-label-lg font-semibold">Continuum Plus</span>
          <span className="font-body-sm text-body-sm text-secondary-fixed-dim">
            {isPlus ? 'Plus aktif. Lihat detail paketmu.' : 'Buka AI tanpa batas ketat dan laporan PDF.'}
          </span>
        </span>
        <span className="material-symbols-outlined text-[20px] text-text-muted" aria-hidden="true">chevron_right</span>
      </Link>

      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-2">
        <section className="flex flex-col gap-space-md rounded-2xl bg-surface-card p-space-lg shadow-soft">
          <span className="font-headline-sm text-headline-sm text-text-primary">Profil &amp; Akun</span>
          <div className="flex items-center gap-space-md">
            <Avatar user={user} size="md" />
            <div className="flex min-w-0 flex-col">
              <span className="break-all font-label-lg text-label-lg font-bold text-text-primary">{user?.email}</span>
              <span className="font-caption text-caption text-text-secondary">
                Member sejak {user ? new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : '-'}
              </span>
            </div>
          </div>
          <Link href="/account" className="w-fit rounded-full bg-accent-lavender px-space-md py-2 font-label-sm text-label-sm font-semibold text-accent-lavender-text hover:opacity-80">
            Kelola akun &amp; foto
          </Link>
          <button onClick={logout} className="w-fit rounded-full bg-surface-container-low px-space-md py-2 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-surface-container">
            Keluar
          </button>
        </section>

        <form onSubmit={onSave} className="flex flex-col gap-space-md rounded-2xl bg-surface-card p-space-lg shadow-soft">
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

      <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-lg shadow-soft">
        <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-text-primary">
          <span className="material-symbols-outlined text-[18px]">event</span>
          Integrasi Google Calendar
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-text-secondary">
          Impor event kalender jadi aktivitas otomatis (sinkron tiap jam, atau manual). Akses hanya baca — Continuum
          tidak pernah mengubah kalendermu.
        </p>
        {calendar && !calendar.available && (
          <p className="font-body-sm text-body-sm text-text-muted">Belum dikonfigurasi di server (butuh Google OAuth credentials).</p>
        )}
        {calendar?.available && (
          <div className="flex flex-wrap items-center gap-space-sm">
            {!calendar.connected ? (
              <button
                onClick={onConnectCalendar}
                disabled={calendarBusy}
                type="button"
                className="w-fit rounded-full bg-accent-lime px-space-md py-2 font-label-md text-label-md font-bold text-text-primary hover:bg-accent-lime-dim disabled:opacity-50"
              >
                Hubungkan Google Calendar
              </button>
            ) : (
              <>
                <button
                  onClick={onSyncCalendar}
                  disabled={calendarBusy}
                  type="button"
                  className="w-fit rounded-full bg-accent-lime px-space-md py-2 font-label-md text-label-md font-bold text-text-primary hover:bg-accent-lime-dim disabled:opacity-50"
                >
                  {calendarBusy ? 'Memproses…' : 'Sync sekarang'}
                </button>
                <button
                  onClick={onDisconnectCalendar}
                  disabled={calendarBusy}
                  type="button"
                  className="w-fit rounded-full bg-surface-container-low px-space-md py-2 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-surface-container disabled:opacity-50"
                >
                  Putuskan
                </button>
                <span className="font-caption text-caption text-text-secondary">
                  {calendar.lastSyncedAt
                    ? `Terakhir sinkron ${new Date(calendar.lastSyncedAt).toLocaleString('id-ID')}`
                    : 'Belum pernah sinkron'}
                </span>
              </>
            )}
          </div>
        )}
        {calendarMessage && <p className="font-body-sm text-body-sm text-text-secondary">{calendarMessage}</p>}
      </section>

      <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-lg shadow-soft">
        <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-text-primary">
          <span className="material-symbols-outlined text-[18px]">phonelink_ring</span>
          Notifikasi Push
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-text-secondary">
          Terima pengingat habit dan insight Coach di perangkat ini, bahkan saat aplikasi ditutup. Pengaturan ini berlaku
          per perangkat.
        </p>
        {pushState === 'unsupported' && (
          <p className="font-body-sm text-body-sm text-text-muted">Browser ini belum mendukung notifikasi push.</p>
        )}
        {pushState === 'needs-install' && (
          <p className="font-body-sm text-body-sm text-text-muted">
            Di iPhone/iPad, tambahkan Continuum ke Layar Utama dulu (Bagikan, lalu Tambah ke Layar Utama), lalu buka dari sana.
          </p>
        )}
        {pushState === 'server-off' && (
          <p className="font-body-sm text-body-sm text-text-muted">Belum dikonfigurasi di server (butuh kunci VAPID).</p>
        )}
        {pushState === 'denied' && (
          <p className="font-body-sm text-body-sm text-text-muted">
            Notifikasi diblokir untuk situs ini. Izinkan lewat pengaturan situs di browser, lalu muat ulang halaman.
          </p>
        )}
        {(pushState === 'on' || pushState === 'off') && (
          <div className="flex flex-wrap items-center gap-space-sm">
            <button
              onClick={onTogglePush}
              disabled={pushBusy}
              type="button"
              role="switch"
              aria-checked={pushState === 'on'}
              className={`w-fit rounded-full px-space-md py-2 font-label-md text-label-md font-bold disabled:opacity-50 ${
                pushState === 'on' ? 'bg-accent-lime text-text-primary' : 'bg-surface-container-low text-text-primary'
              }`}
            >
              {pushState === 'on' ? 'Aktif di perangkat ini — klik untuk matikan' : 'Aktifkan di perangkat ini'}
            </button>
            {pushState === 'on' && (
              <button
                onClick={onTestPush}
                disabled={pushBusy}
                type="button"
                className="w-fit rounded-full bg-surface-container-low px-space-md py-2 font-label-sm text-label-sm font-semibold text-text-primary hover:bg-surface-container disabled:opacity-50"
              >
                Kirim tes
              </button>
            )}
          </div>
        )}
        {pushMessage && <p className="font-body-sm text-body-sm text-text-secondary">{pushMessage}</p>}
      </section>

      <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-lg shadow-soft">
        <div className="flex items-center gap-2 font-label-md text-label-md font-semibold text-text-primary">
          <span className="material-symbols-outlined text-[18px]">notifications_active</span>
          Insight AI Proaktif
        </div>
        <p className="font-body-sm text-body-sm leading-relaxed text-text-secondary">
          Coach mengirim notifikasi singkat saat ada hal yang layak disampaikan: rangkuman tiap Senin pagi, ajakan
          kembali setelah beberapa hari jeda, dan pola mingguan yang ia temukan. Tidak pernah menyalahkan, dan
          maksimal beberapa kali seminggu.
        </p>
        <button
          onClick={onToggleInsights}
          disabled={insightsSaving}
          type="button"
          role="switch"
          aria-checked={insightsOn}
          className={`w-fit rounded-full px-space-md py-2 font-label-md text-label-md font-bold disabled:opacity-50 ${
            insightsOn ? 'bg-accent-lime text-text-primary' : 'bg-surface-container-low text-text-primary'
          }`}
        >
          {insightsOn ? 'Aktif — klik untuk matikan' : 'Nonaktif — klik untuk aktifkan'}
        </button>
      </section>

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

      <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-lg shadow-soft">
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
