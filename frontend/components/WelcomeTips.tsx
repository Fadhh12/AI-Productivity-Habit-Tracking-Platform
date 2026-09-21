'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const KEY = 'continuum_tips_dismissed';

const TIPS = [
  { icon: 'check_circle', title: 'Ketuk centang', body: 'Tandai habit selesai. Satu ketukan sudah cukup.', href: '/habit-tracker' },
  { icon: 'auto_awesome', title: 'Coba Catat AI', body: 'Ketik kegiatanmu seperti chat, AI menyusun jadwalnya.', href: null },
  { icon: 'forum', title: 'Tanya Coach', body: 'Minta saran berdasarkan habit dan aktivitasmu.', href: '/coach' },
];

/** One-time tour card on the dashboard. Stays hidden once dismissed (remembered in localStorage). */
export function WelcomeTips() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      setShow(localStorage.getItem(KEY) !== '1');
    } catch {
      setShow(false);
    }
  }, []);

  function dismiss() {
    setShow(false);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* storage blocked: it will simply show again next visit */
    }
  }

  if (!show) return null;

  return (
    <section aria-label="Tips memulai" className="animate-fade-up rounded-2xl bg-sidebar-dark p-space-md text-white sm:p-space-lg">
      <div className="flex items-start justify-between gap-space-sm">
        <div>
          <h2 className="font-headline-sm text-headline-sm font-bold">Selamat datang di Continuum</h2>
          <p className="mt-1 font-body-sm text-body-sm text-secondary-fixed-dim">Tiga hal kecil untuk memulai.</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup tips"
          className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
            close
          </span>
        </button>
      </div>
      <ul className="stagger mt-space-md grid grid-cols-1 gap-space-sm sm:grid-cols-3">
        {TIPS.map((t) => {
          const inner = (
            <>
              <span className="material-symbols-outlined text-[22px] text-accent-lime" aria-hidden="true">
                {t.icon}
              </span>
              <span className="mt-2 block font-label-md text-label-md font-bold">{t.title}</span>
              <span className="mt-0.5 block font-caption text-caption text-secondary-fixed-dim">{t.body}</span>
            </>
          );
          const cls = 'press block h-full rounded-xl bg-white/[0.06] p-space-md text-left hover:bg-white/10';
          return (
            <li key={t.title}>
              {t.href ? (
                <Link href={t.href} className={cls}>
                  {inner}
                </Link>
              ) : (
                <div className={cls}>{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
