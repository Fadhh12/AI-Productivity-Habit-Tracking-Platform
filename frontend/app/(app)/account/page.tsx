'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePlan } from '@/lib/plan';
import { apiFetch, ApiError } from '@/lib/api';
import { fileToAvatarDataUrl } from '@/lib/image';
import { GamificationSummary } from '@/lib/types';
import { Avatar, displayNameOf } from '@/components/Avatar';

export default function AccountPage() {
  const { user, refreshUser, logout } = useAuth();
  const { isPlus, plan } = usePlan();
  const fileRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [name, setName] = useState(user?.displayName ?? '');
  const [busy, setBusy] = useState<'photo' | 'name' | null>(null);
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiFetch<GamificationSummary>('/api/gamification/summary')
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    setName(user?.displayName ?? '');
  }, [user?.displayName]);

  if (!user) return null;

  async function patch(body: object, which: 'photo' | 'name', okText: string) {
    setBusy(which);
    setMessage(null);
    try {
      await apiFetch('/api/users/me', { method: 'PATCH', body: JSON.stringify(body) });
      await refreshUser();
      setMessage({ kind: 'ok', text: okText });
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof ApiError ? err.message : 'Gagal menyimpan. Coba lagi.' });
    } finally {
      setBusy(null);
    }
  }

  async function onPickPhoto(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const avatar = await fileToAvatarDataUrl(file);
      await patch({ avatar }, 'photo', 'Foto profil diperbarui.');
    } catch (err) {
      setMessage({ kind: 'error', text: err instanceof Error ? err.message : 'Gagal memproses foto.' });
    }
  }

  function onSaveName(e: FormEvent) {
    e.preventDefault();
    void patch({ displayName: name }, 'name', 'Nama diperbarui.');
  }

  const stats = [
    { label: 'Level', value: summary ? String(summary.level) : '–', icon: 'military_tech' },
    { label: 'Streak terpanjang', value: summary ? `${summary.stats.longestStreak} hari` : '–', icon: 'local_fire_department' },
    { label: 'Total check-in', value: summary ? String(summary.stats.doneCheckins) : '–', icon: 'check_circle' },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-space-lg">
      <section className="flex flex-col items-center gap-space-md rounded-2xl bg-surface-card p-space-lg text-center shadow-sm">
        <div className="relative">
          <Avatar user={user} size="xl" className="ring-4 ring-accent-lavender" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy !== null}
            aria-label="Ganti foto profil"
            className="absolute -bottom-1 -right-1 flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-dark text-white shadow-md hover:bg-accent-lime hover:text-text-primary disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              {busy === 'photo' ? 'progress_activity' : 'photo_camera'}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-text-primary">{displayNameOf(user)}</h1>
          <p className="break-all font-body-sm text-body-sm text-text-secondary">{user.email}</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-surface-container-low px-3 py-1 font-label-sm text-label-sm text-text-secondary">
              Member sejak{' '}
              {new Date(user.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            <span
              className={`rounded-full px-3 py-1 font-label-sm text-label-sm font-bold ${
                isPlus ? 'bg-accent-lime text-text-primary' : 'bg-accent-lavender text-accent-lavender-text'
              }`}
            >
              {plan ? (isPlus ? 'Plus' : 'Gratis') : '…'}
            </span>
          </div>
        </div>
        {user.avatar && (
          <button
            type="button"
            onClick={() => patch({ avatar: null }, 'photo', 'Foto profil dihapus.')}
            disabled={busy !== null}
            className="min-h-[36px] rounded-full px-3 font-label-sm text-label-sm font-semibold text-text-secondary hover:bg-surface-container-low disabled:opacity-50"
          >
            Hapus foto
          </button>
        )}
        {message && (
          <p
            role="status"
            className={`w-full rounded-lg px-3 py-2 font-body-sm text-body-sm ${
              message.kind === 'ok' ? 'bg-accent-mint text-accent-mint-text' : 'bg-error-container text-on-error-container'
            }`}
          >
            {message.text}
          </p>
        )}
      </section>

      <section className="grid grid-cols-3 gap-space-sm">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center gap-1 rounded-2xl bg-surface-card p-space-md text-center shadow-sm">
            <span className="material-symbols-outlined text-[22px] text-tertiary" aria-hidden="true">
              {s.icon}
            </span>
            <span className="font-headline-sm text-headline-sm font-bold text-text-primary">{s.value}</span>
            <span className="font-caption text-caption text-text-secondary">{s.label}</span>
          </div>
        ))}
      </section>

      <form onSubmit={onSaveName} className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-md shadow-sm sm:p-space-lg">
        <label htmlFor="displayName" className="font-headline-sm text-headline-sm font-bold text-text-primary">
          Nama tampilan
        </label>
        <p className="font-body-sm text-body-sm text-text-secondary">Nama ini muncul di header dan kartu yang kamu bagikan.</p>
        <div className="flex flex-col gap-space-sm sm:flex-row">
          <input
            id="displayName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder={user.email.split('@')[0]}
            className="min-h-[44px] flex-1 rounded-full bg-surface-container-low px-space-md font-body-sm text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-sidebar-dark"
          />
          <button
            type="submit"
            disabled={busy !== null || name.trim() === (user.displayName ?? '')}
            className="min-h-[44px] rounded-full bg-sidebar-dark px-space-lg font-label-md text-label-md font-semibold text-white hover:bg-accent-lime hover:text-text-primary disabled:opacity-50"
          >
            {busy === 'name' ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>

      <section className="flex flex-col overflow-hidden rounded-2xl bg-surface-card shadow-sm">
        {[
          { href: '/plus', icon: 'workspace_premium', label: 'Continuum Plus', hint: isPlus ? 'Aktif' : 'Lihat keuntungan' },
          { href: '/achievements', icon: 'emoji_events', label: 'Pencapaian & lencana', hint: '' },
          { href: '/settings', icon: 'settings', label: 'Pengaturan', hint: 'Zona waktu, notifikasi, integrasi' },
        ].map((row) => (
          <Link
            key={row.href}
            href={row.href}
            className="flex min-h-[56px] items-center gap-space-md border-b border-border-subtle px-space-md last:border-b-0 hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[22px] text-text-secondary" aria-hidden="true">
              {row.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-label-md text-label-md font-semibold text-text-primary">{row.label}</span>
              {row.hint && <span className="truncate font-caption text-caption text-text-secondary">{row.hint}</span>}
            </span>
            <span className="material-symbols-outlined text-[20px] text-text-muted" aria-hidden="true">
              chevron_right
            </span>
          </Link>
        ))}
      </section>

      <button
        type="button"
        onClick={() => void logout()}
        className="min-h-[48px] rounded-full bg-surface-container-low font-label-md text-label-md font-semibold text-text-primary hover:bg-surface-container"
      >
        Keluar
      </button>
    </div>
  );
}
