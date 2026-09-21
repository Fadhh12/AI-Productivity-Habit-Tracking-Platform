'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { AuthMascot } from '@/components/AuthMascot';

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const timezone = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, timezone);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal daftar. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-canvas-bg px-space-md py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 animate-float rounded-full bg-accent-lime/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 animate-float rounded-full bg-accent-lavender blur-3xl" style={{ animationDelay: '1.5s' }} />
      <div className="relative mt-24 w-full max-w-sm animate-scale-in rounded-2xl bg-surface-card p-space-lg shadow-lift">
        <AuthMascot passwordFocused={passwordFocused} submitting={submitting} error={error} />
        <div className="mb-space-lg flex items-center gap-space-sm">
          <div className="flex h-9 w-9 animate-pop items-center justify-center rounded-full bg-accent-lime font-headline-md text-headline-md font-bold text-text-primary">
            C
          </div>
          <span className="font-headline-md text-headline-md tracking-tight text-text-primary">Continuum</span>
        </div>
        <h1 className="font-headline-sm text-headline-sm font-bold text-text-primary">Buat akun baru</h1>
        <p className="mt-1 font-body-sm text-body-sm text-text-secondary">
          Daftar cepat — tanpa survei panjang. Zona waktu terdeteksi: <strong className="text-text-primary">{timezone}</strong>
        </p>

        <form onSubmit={onSubmit} className="mt-space-lg flex flex-col gap-space-md">
          <div>
            <label className="mb-1 block font-label-md text-label-md font-medium text-text-secondary">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-sidebar-dark"
            />
          </div>
          <div>
            <label className="mb-1 block font-label-md text-label-md font-medium text-text-secondary">Password</label>
            <input
              type="password"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 8 karakter, huruf + angka"
              autoComplete="new-password"
              className="w-full rounded-xl border-0 bg-surface-container-low px-space-md py-space-sm font-body-sm text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-sidebar-dark"
            />
          </div>

          {error && <p className="rounded-lg bg-error-container px-3 py-2 font-body-sm text-body-sm text-on-error-container">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-accent-lime py-space-sm font-label-lg text-label-lg font-bold text-text-primary press hover:bg-accent-lime-dim disabled:opacity-50"
          >
            {submitting ? 'Memproses…' : 'Daftar'}
          </button>
        </form>

        <p className="mt-space-lg text-center font-body-sm text-body-sm text-text-secondary">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-semibold text-tertiary hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
