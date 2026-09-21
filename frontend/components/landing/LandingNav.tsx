'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthCtas } from './AuthCtas';

const LINKS = [
  { href: '#filosofi', label: 'Filosofi' },
  { href: '#fitur', label: 'Fitur' },
  { href: '#cara-kerja', label: 'Cara kerja' },
  { href: '#paket', label: 'Paket' },
];

/** Floating glass pill on desktop; hamburger that morphs into an X and opens a full-screen menu on mobile. */
export function LandingNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-3 z-40 flex justify-center px-3 sm:top-5">
        <nav
          aria-label="Navigasi landing"
          className="flex h-14 w-full max-w-5xl items-center justify-between gap-4 rounded-full bg-[#16171D]/80 py-2 pl-5 pr-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_40px_-16px_rgba(0,0,0,0.6)] ring-1 ring-white/10 backdrop-blur-xl"
        >
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-lime text-[15px] font-bold text-sidebar-dark">
              C
            </span>
            <span className="text-[17px] font-bold tracking-tight text-white">Continuum</span>
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="press rounded-full px-4 py-2 text-[14px] font-medium text-white/70 hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <AuthCtas size="nav" className="hidden sm:flex" />
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? 'Tutup menu' : 'Buka menu'}
              className="press relative flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 lg:hidden"
            >
              <span
                className={`absolute h-[2px] w-4 rounded-full bg-white transition-transform duration-500 ease-spring ${open ? 'rotate-45' : '-translate-y-[3px]'}`}
              />
              <span
                className={`absolute h-[2px] w-4 rounded-full bg-white transition-transform duration-500 ease-spring ${open ? '-rotate-45' : 'translate-y-[3px]'}`}
              />
            </button>
          </div>
        </nav>
      </header>

      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-30 flex flex-col justify-center bg-[#0F1015]/95 px-8 backdrop-blur-2xl transition-opacity duration-500 ease-spring lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <ul className="flex flex-col gap-2">
          {LINKS.map((l, i) => (
            <li
              key={l.href}
              className={`transition-[opacity,transform] duration-700 ease-spring ${open ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
              style={{ transitionDelay: open ? `${120 + i * 70}ms` : '0ms' }}
            >
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="block py-2 text-[34px] font-bold tracking-tight text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div
          className={`mt-10 transition-[opacity,transform] duration-700 ease-spring sm:hidden ${open ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}
          style={{ transitionDelay: open ? '420ms' : '0ms' }}
        >
          <AuthCtas />
        </div>
      </div>
    </>
  );
}
