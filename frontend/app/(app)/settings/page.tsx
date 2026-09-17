'use client';

import { FormEvent, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';

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
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">Setelan</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </header>

      <form onSubmit={onSave} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
        <label className="block text-sm font-medium text-gray-700">Zona waktu</label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
          className="w-full rounded-lg bg-brand-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? 'Menyimpan…' : 'Simpan'}
        </button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </form>

      <button onClick={logout} className="w-full rounded-lg bg-gray-100 py-2.5 text-sm font-medium text-gray-700">
        Keluar
      </button>
    </div>
  );
}
