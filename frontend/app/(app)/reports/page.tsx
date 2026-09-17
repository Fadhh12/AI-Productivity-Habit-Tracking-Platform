'use client';

import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { MonthlyReport } from '@/lib/types';

interface Digest {
  period: string;
  narrative: string;
  highlights: string[];
  ai_available: boolean;
  fallback: boolean;
  is_ai_generated: boolean;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function ReportsPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadReport() {
    setLoading(true);
    try {
      setReport(await apiFetch<MonthlyReport>(`/api/reports/monthly?month=${currentMonth()}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat laporan.');
    } finally {
      setLoading(false);
    }
  }

  async function loadDigest() {
    try {
      setDigest(await apiFetch<Digest>('/api/ai/digest?period=monthly'));
    } catch {
      // Digest card fails independently — the raw report above still renders normally.
    }
  }

  useEffect(() => {
    loadReport();
    loadDigest();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await apiFetch('/api/reports/refresh', { method: 'POST', body: JSON.stringify({ month: currentMonth() }) });
      setTimeout(loadReport, 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memicu refresh.');
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <p className="text-gray-400">Memuat…</p>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Laporan bulan ini</h1>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="text-sm font-medium text-brand-600 disabled:opacity-50"
        >
          {refreshing ? 'Memproses…' : '↻ Refresh'}
        </button>
      </header>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-xl border border-brand-200 bg-brand-50 p-4">
        {digest ? (
          <>
            <span className={digest.is_ai_generated ? 'badge-ai' : 'rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600'}>
              {digest.is_ai_generated ? '✨ AI Digest' : 'Ringkasan (AI belum tersedia)'}
            </span>
            <p className="mt-2 text-sm text-gray-800">{digest.narrative}</p>
            <ul className="mt-2 space-y-0.5 text-xs text-gray-600">
              {digest.highlights.map((h, i) => (
                <li key={i}>· {h}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-gray-500">Ringkasan AI belum tersedia, coba muat ulang.</p>
        )}
      </section>

      {!report?.available ? (
        <p className="text-sm text-gray-500">{report?.message ?? 'Laporan belum tersedia.'}</p>
      ) : (
        <>
          <section>
            <h2 className="mb-2 font-semibold text-gray-800">Distribusi kategori (menit)</h2>
            <div className="space-y-1">
              {Object.entries(report.data!.categoryDistributionMinutes).map(([name, minutes]) => (
                <div key={name} className="flex justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
                  <span>{name}</span>
                  <span className="font-medium">{Math.round(minutes)} mnt</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-gray-800">Checkin habit</h2>
            <div className="flex gap-2 text-sm">
              {Object.entries(report.data!.checkinStatusCounts).map(([status, count]) => (
                <div key={status} className="flex-1 rounded-lg bg-white px-3 py-2 text-center shadow-sm">
                  <p className="text-lg font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">{status}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-2 font-semibold text-gray-800">Tren streak habit</h2>
            <ul className="space-y-1 text-sm text-gray-700">
              {report.data!.habitStreakTrend.map((h) => (
                <li key={h.habitId} className="flex justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                  <span>{h.name}</span>
                  <span>🔥 {h.currentStreak}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
