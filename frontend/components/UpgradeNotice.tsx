'use client';

import Link from 'next/link';

/** Friendly replacement for a raw 403/429 when a Plus feature or the free daily limit is hit. */
export function UpgradeNotice({ message, dark = false }: { message: string; dark?: boolean }) {
  return (
    <div
      className={`flex flex-col gap-space-sm rounded-xl p-space-md sm:flex-row sm:items-center ${
        dark ? 'bg-sidebar-card text-white' : 'bg-accent-lavender/50 text-text-primary'
      }`}
    >
      <span
        className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-lime text-[22px] text-text-primary"
        aria-hidden="true"
      >
        workspace_premium
      </span>
      <p className={`flex-1 font-body-sm text-body-sm ${dark ? 'text-secondary-fixed-dim' : 'text-text-secondary'}`}>{message}</p>
      <Link
        href="/plus"
        className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-sidebar-dark px-space-md font-label-md text-label-md font-semibold text-white hover:bg-accent-lime hover:text-text-primary"
      >
        Lihat Continuum Plus
      </Link>
    </div>
  );
}
