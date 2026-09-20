'use client';

import { usePlan } from '@/lib/plan';
import { SkeletonBlock } from '@/components/Skeleton';

interface Row {
  label: string;
  free: string | boolean;
  plus: string | boolean;
}

const ROWS: Row[] = [
  { label: 'Habit, streak, goals & log aktivitas', free: true, plus: true },
  { label: 'Pengingat, mode offline & lencana', free: true, plus: true },
  { label: 'Coach AI', free: '5 pesan/hari', plus: 'Jauh lebih banyak' },
  { label: 'Fitur AI lain (quick-add, refleksi, digest mingguan)', free: '10/hari', plus: 'Jauh lebih banyak' },
  { label: 'Digest AI bulanan', free: false, plus: true },
  { label: 'Deteksi pola AI', free: false, plus: true },
  { label: 'Insight proaktif lengkap (comeback & pola)', free: 'Ringkasan mingguan', plus: true },
  { label: 'Tantangan mingguan dari AI, dipersonalisasi', free: 'Template', plus: true },
  { label: 'Export laporan PDF', free: 'CSV saja', plus: true },
  { label: 'Sinkron Google Calendar otomatis', free: 'Manual', plus: true },
];

function Cell({ value }: { value: string | boolean }) {
  if (value === true) return <span className="material-symbols-outlined text-[20px] text-accent-mint-text" aria-label="Termasuk">check_circle</span>;
  if (value === false) return <span className="material-symbols-outlined text-[20px] text-text-muted" aria-label="Tidak termasuk">remove</span>;
  return <span className="font-label-sm text-label-sm text-text-secondary">{value}</span>;
}

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(1, limit)) * 100));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between font-label-sm text-label-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-semibold text-text-primary">
          {used}/{limit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-container">
        <div className="h-full rounded-full bg-accent-lime" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PlusPage() {
  const { plan, isPlus } = usePlan();

  if (!plan) return <SkeletonBlock className="h-96 rounded-2xl" />;

  const until = plan.premiumUntil
    ? new Date(plan.premiumUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-space-lg">
      <div className="relative overflow-hidden rounded-2xl bg-sidebar-dark p-space-lg text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-accent-lime/10 blur-3xl" />
        <div className="relative flex flex-col gap-space-sm">
          <span className="flex w-fit items-center gap-1 rounded-full bg-accent-lime px-3 py-1 font-label-sm text-label-sm font-bold uppercase text-text-primary">
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">workspace_premium</span>
            {isPlus ? 'Plus aktif' : 'Paket Gratis'}
          </span>
          <h1 className="font-headline-lg text-headline-lg tracking-tight">Continuum Plus</h1>
          <p className="font-body-md text-body-md text-secondary-fixed-dim">
            {isPlus
              ? `Terima kasih sudah mendukung Continuum. Aktif sampai ${until}.`
              : 'Semua fitur inti tetap gratis selamanya. Plus menambah AI yang lebih dalam dan tanpa batas ketat.'}
          </p>
          {!isPlus && (
            <>
              <button
                type="button"
                disabled
                className="mt-space-xs inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-accent-lime px-space-lg font-label-lg text-label-lg font-bold text-text-primary opacity-60 sm:w-fit"
              >
                Berlangganan
              </button>
              <p className="font-caption text-caption text-secondary-fixed-dim">
                Langganan akan tersedia lewat Google Play saat aplikasi Android dirilis.
              </p>
            </>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-space-sm rounded-2xl bg-surface-card p-space-md shadow-sm sm:p-space-lg">
        <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Pemakaian AI hari ini</h2>
        <Meter label="Pesan Coach" used={plan.usage.coach.used} limit={plan.usage.coach.limit} />
        <Meter label="Permintaan AI lain" used={plan.usage.ai.used} limit={plan.usage.ai.limit} />
      </section>

      <section className="rounded-2xl bg-surface-card p-space-md shadow-sm sm:p-space-lg">
        <h2 className="mb-space-sm font-headline-sm text-headline-sm font-bold text-text-primary">Gratis vs Plus</h2>
        <div className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-x-2 pb-2 font-label-sm text-label-sm uppercase text-text-muted sm:grid-cols-[1fr_9rem_9rem]">
          <span />
          <span className="text-center">Gratis</span>
          <span className="text-center text-accent-lavender-text">Plus</span>
        </div>
        <ul className="flex flex-col divide-y divide-border-subtle">
          {ROWS.map((row) => (
            <li
              key={row.label}
              className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-x-2 py-space-sm sm:grid-cols-[1fr_9rem_9rem]"
            >
              <span className="font-body-sm text-body-sm text-text-primary">{row.label}</span>
              <span className="flex justify-center text-center">
                <Cell value={row.free} />
              </span>
              <span className="flex justify-center text-center">
                <Cell value={row.plus} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
