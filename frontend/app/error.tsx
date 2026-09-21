'use client';

import Link from 'next/link';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-canvas-bg px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-terracotta text-accent-terracotta-text">
        <span className="material-symbols-outlined text-[28px]" aria-hidden="true">
          sync_problem
        </span>
      </span>
      <h1 className="text-[28px] font-bold tracking-tight text-text-primary">Ada yang tidak berjalan.</h1>
      <p className="max-w-[38ch] text-[15px] leading-relaxed text-text-secondary">
        Kami tidak bisa memuat halaman ini. Datamu tidak hilang. Coba lagi sebentar.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="press rounded-full bg-accent-lime px-6 py-3 text-[15px] font-bold text-text-primary hover:bg-accent-lime-dim"
        >
          Coba lagi
        </button>
        <Link
          href="/"
          className="press rounded-full bg-surface-card px-6 py-3 text-[15px] font-semibold text-text-primary shadow-soft"
        >
          Ke beranda
        </Link>
      </div>
    </div>
  );
}
