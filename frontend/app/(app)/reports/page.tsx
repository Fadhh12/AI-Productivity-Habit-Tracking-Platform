'use client';

import { useEffect, useState } from 'react';
import { apiFetch, apiDownload, ApiError } from '@/lib/api';
import { upgradeReason, UpgradeReason } from '@/lib/premium';
import { UpgradeNotice } from '@/components/UpgradeNotice';
import { MonthlyReport, PatternDetection } from '@/lib/types';
import { SkeletonBlock } from '@/components/Skeleton';

function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-space-lg" role="status" aria-label="Memuat…">
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
        <div className="flex flex-col gap-space-xs">
          <SkeletonBlock className="h-7 w-80 max-w-full" />
          <SkeletonBlock className="h-4 w-40" />
        </div>
        <SkeletonBlock className="h-10 w-40 rounded-full" />
      </div>

      <SkeletonBlock className="h-40 rounded-2xl" />

      <div className="grid grid-cols-1 gap-space-lg xl:grid-cols-12">
        <section className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-soft xl:col-span-6">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-3 w-full rounded-full" />
          <div className="flex flex-col gap-space-xs">
            {[0, 1, 2].map((i) => (
              <SkeletonBlock key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-soft xl:col-span-6">
          <SkeletonBlock className="h-6 w-56" />
          <div className="grid grid-cols-3 gap-space-sm">
            {[0, 1, 2].map((i) => (
              <SkeletonBlock key={i} className="h-20 rounded-xl" />
            ))}
          </div>
          <div className="flex flex-col gap-space-xs pt-space-xs">
            {[0, 1].map((i) => (
              <SkeletonBlock key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-soft xl:col-span-12">
          <SkeletonBlock className="h-6 w-40" />
          <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

interface Digest {
  period: string;
  narrative: string;
  highlights: string[];
  ai_available: boolean;
  fallback: boolean;
  is_ai_generated: boolean;
}

const PALETTE = ['#CCFF00', '#6D3BD7', '#EDE9FE', '#FFEDD5', '#D1FAE5', '#A1A1AA'];

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function ReportsPage() {
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [digest, setDigest] = useState<Digest | null>(null);
  const [patterns, setPatterns] = useState<PatternDetection | null>(null);
  const [patternsLoading, setPatternsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [digestLocked, setDigestLocked] = useState<UpgradeReason | null>(null);
  const [patternsLocked, setPatternsLocked] = useState<UpgradeReason | null>(null);
  const [exportLocked, setExportLocked] = useState<UpgradeReason | null>(null);

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
    } catch (err) {
      // Digest card fails independently — the raw report below still renders normally.
      setDigestLocked(upgradeReason(err));
    }
  }

  async function loadPatterns() {
    setPatternsLoading(true);
    try {
      setPatterns(await apiFetch<PatternDetection>('/api/ai/pattern-detection'));
    } catch (err) {
      // Pattern card fails independently — the raw report above still renders normally.
      setPatternsLocked(upgradeReason(err));
    } finally {
      setPatternsLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
    loadDigest();
    loadPatterns();
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

  async function onExport(format: 'csv' | 'pdf') {
    setExporting(format);
    try {
      await apiDownload(
        `/api/reports/monthly/export?month=${currentMonth()}&format=${format}`,
        `continuum-report-${currentMonth()}.${format}`,
      );
    } catch (err) {
      const locked = upgradeReason(err);
      if (locked) setExportLocked(locked);
      else setError(err instanceof ApiError ? err.message : 'Gagal export laporan.');
    } finally {
      setExporting(null);
    }
  }

  if (loading) return <ReportsSkeleton />;

  const monthLabel = new Date(`${currentMonth()}-01`).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const distributionEntries = report?.data ? Object.entries(report.data.categoryDistributionMinutes) : [];
  const totalMinutes = distributionEntries.reduce((sum, [, m]) => sum + m, 0);

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col justify-between gap-space-md md:flex-row md:items-center">
        <div className="flex flex-col gap-space-xs">
          <h1 className="font-headline-lg text-headline-lg tracking-tight text-text-primary">AI Reports &amp; Rollup Digest</h1>
          <p className="font-body-md text-body-md text-text-secondary">Ringkasan {monthLabel}</p>
        </div>
        <div className="flex w-fit items-center gap-space-sm">
          <button
            onClick={() => onExport('csv')}
            disabled={exporting !== null || !report?.available}
            className="press flex items-center gap-1 rounded-full bg-surface-card px-space-md py-space-sm font-label-md text-label-md font-semibold text-text-primary shadow-soft hover:bg-surface-container-low disabled:opacity-50"
            type="button"
            title="Export laporan sebagai CSV"
          >
            <span className="material-symbols-outlined text-[18px]">
              {exporting === 'csv' ? 'progress_activity' : 'table_view'}
            </span>
            CSV
          </button>
          <button
            onClick={() => onExport('pdf')}
            disabled={exporting !== null || !report?.available}
            className="press flex items-center gap-1 rounded-full bg-surface-card px-space-md py-space-sm font-label-md text-label-md font-semibold text-text-primary shadow-soft hover:bg-surface-container-low disabled:opacity-50"
            type="button"
            title="Export laporan sebagai PDF"
          >
            <span className="material-symbols-outlined text-[18px]">
              {exporting === 'pdf' ? 'progress_activity' : 'picture_as_pdf'}
            </span>
            PDF
          </button>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="press flex items-center gap-1 rounded-full bg-surface-card px-space-md py-space-sm font-label-md text-label-md font-semibold text-text-primary shadow-soft hover:bg-surface-container-low disabled:opacity-50"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            {refreshing ? 'Memproses…' : 'Refresh laporan'}
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">{error}</p>}
      {exportLocked && <UpgradeNotice message={exportLocked.message} />}

      <div className="relative overflow-hidden rounded-2xl bg-sidebar-dark p-space-lg text-white shadow-[0_24px_48px_-16px_rgba(22,23,29,0.45)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-accent-lime/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-space-sm">
          {digestLocked && <UpgradeNotice dark message={digestLocked.message} />}
          {!digestLocked && (
            <span className={digest?.is_ai_generated ? 'badge-ai w-fit' : 'w-fit rounded-full bg-sidebar-card px-2 py-0.5 text-xs text-text-muted'}>
              {digest?.is_ai_generated ? '✨ AI Digest' : 'Ringkasan (AI belum tersedia)'}
            </span>
          )}
          {!digestLocked && (
          <h2 className="font-headline-md text-headline-md tracking-tight text-white">
            {digest?.narrative ?? 'Ringkasan AI belum tersedia, coba muat ulang.'}
          </h2>
          )}
          {digest && digest.highlights.length > 0 && (
            <ul className="mt-space-xs flex flex-col gap-1 font-body-sm text-body-sm text-secondary-fixed-dim">
              {digest.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-lime" />
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {!report?.available ? (
        <p className="rounded-2xl bg-surface-card p-space-lg text-center font-body-sm text-body-sm text-text-muted shadow-soft">
          {report?.message ?? 'Laporan belum tersedia.'}
        </p>
      ) : (
        <div className="stagger grid grid-cols-1 gap-space-lg xl:grid-cols-12">
          <section className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-soft xl:col-span-6">
            <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Distribusi Waktu</h3>
            {distributionEntries.length === 0 ? (
              <p className="font-body-sm text-body-sm text-text-muted">Belum ada data aktivitas bulan ini.</p>
            ) : (
              <>
                <div className="flex h-3 w-full origin-left animate-grow-x overflow-hidden rounded-full bg-surface-container">
                  {distributionEntries.map(([name, minutes], i) => (
                    <div key={name} style={{ width: `${(minutes / totalMinutes) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length] }} />
                  ))}
                </div>
                <div className="flex flex-col gap-space-xs">
                  {distributionEntries.map(([name, minutes], i) => (
                    <div key={name} className="flex items-center justify-between rounded-xl p-2 hover:bg-surface-bright">
                      <div className="flex items-center gap-space-sm">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                        <span className="font-label-md text-label-md font-medium text-text-primary">{name}</span>
                      </div>
                      <span className="font-label-md text-label-md font-bold text-text-primary">{Math.round(minutes)} mnt</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-soft xl:col-span-6">
            <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Consistency &amp; Forgiveness</h3>
            <div className="grid grid-cols-3 gap-space-sm">
              {Object.entries(report.data!.checkinStatusCounts).map(([status, count]) => (
                <div key={status} className="flex flex-col items-center rounded-xl bg-surface-container-low px-space-sm py-space-md text-center">
                  <p className="font-headline-md text-headline-md font-bold text-text-primary">{count}</p>
                  <p className="font-caption text-caption capitalize text-text-secondary">{status.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-space-xs pt-space-xs">
              <span className="font-label-md text-label-md font-semibold text-text-primary">Tren Streak Habit</span>
              {report.data!.habitStreakTrend.length === 0 ? (
                <p className="font-body-sm text-body-sm text-text-muted">Belum ada habit dengan streak.</p>
              ) : (
                report.data!.habitStreakTrend.map((h) => (
                  <div key={h.habitId} className="flex items-center justify-between rounded-xl bg-surface-container-low px-space-sm py-space-sm">
                    <span className="font-label-md text-label-md text-text-primary">{h.name}</span>
                    <span className="flex items-center gap-1 font-label-md text-label-md font-bold text-accent-terracotta-text">
                      <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                      {h.currentStreak}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-soft xl:col-span-12">
            <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Progress Goal</h3>
            {report.data!.goalProgress.length === 0 ? (
              <p className="font-body-sm text-body-sm text-text-muted">Belum ada goal dengan habit terpaut.</p>
            ) : (
              <div className="grid grid-cols-1 gap-space-sm md:grid-cols-2">
                {report.data!.goalProgress.map((g) => {
                  const pct = g.habitCount === 0 ? 0 : Math.round((g.doneCount / g.habitCount) * 100);
                  return (
                    <div key={g.goalId} className="flex flex-col gap-space-xs rounded-xl bg-surface-container-low p-space-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-label-md text-label-md font-semibold text-text-primary">{g.goalTitle}</span>
                        <span className="font-label-md text-label-md font-bold text-text-primary">{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                        <div className="h-full origin-left animate-grow-x rounded-full bg-accent-lime" style={{ transform: `scaleX(${Math.min(1, Math.max(0, pct / 100))})` }} />
                      </div>
                      <span className="font-caption text-caption text-text-secondary">
                        {g.doneCount} / {g.habitCount} habit selesai
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-space-md rounded-lg bg-surface-card p-space-lg shadow-soft xl:col-span-12">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm font-bold text-text-primary">Pola &amp; Insight AI</h3>
              {patterns && (
                <span
                  className={
                    patterns.is_ai_generated
                      ? 'badge-ai'
                      : 'w-fit rounded-full bg-surface-container px-2 py-0.5 text-xs text-text-secondary'
                  }
                >
                  {patterns.is_ai_generated ? '✨ AI' : 'Analisis dasar (AI belum tersedia)'}
                </span>
              )}
            </div>
            {patternsLocked ? (
              <UpgradeNotice message={patternsLocked.message} />
            ) : patternsLoading ? (
              <div className="flex flex-col gap-space-xs">
                {[0, 1].map((i) => (
                  <SkeletonBlock key={i} className="h-10 rounded-xl" />
                ))}
              </div>
            ) : patterns && patterns.patterns.length > 0 ? (
              <ul className="flex flex-col gap-space-xs">
                {patterns.patterns.map((p, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-space-sm rounded-xl bg-surface-container-low p-space-sm font-body-sm text-body-sm text-text-primary"
                  >
                    <span className="material-symbols-outlined mt-0.5 shrink-0 text-[16px] text-tertiary">insights</span>
                    {p}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-body-sm text-body-sm text-text-muted">Belum ada pola yang terdeteksi.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
