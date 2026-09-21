'use client';

import { useEffect, useState } from 'react';
import { Mascot } from '@/components/Mascot';

const KEY = 'continuum_splash_seen';

type Phase = 'show' | 'leave' | 'gone';

function initialPhase(): Phase {
  try {
    if (sessionStorage.getItem(KEY)) return 'gone';
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'gone';
    return 'show';
  } catch {
    return 'gone';
  }
}

/** A short intro on the first open of each session: the mascot hops in, then the app fades in. Tap to skip. */
export function Splash() {
  const [phase, setPhase] = useState<Phase>(initialPhase);

  // Start the fade-out after the intro has played.
  useEffect(() => {
    if (phase !== 'show') return;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* storage blocked: the intro may replay on the next visit */
    }
    const t = setTimeout(() => setPhase('leave'), 1700);
    return () => clearTimeout(t);
  }, [phase]);

  // Remove the overlay once the fade-out has finished (also when the user taps to skip).
  useEffect(() => {
    if (phase !== 'leave') return;
    const t = setTimeout(() => setPhase('gone'), 600);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      role="presentation"
      onClick={() => setPhase('leave')}
      className={`force-light fixed inset-0 z-[80] flex cursor-pointer flex-col items-center justify-center gap-6 bg-[linear-gradient(160deg,#6D3BD7,#3B1A85)] px-6 text-center text-white transition-opacity duration-500 ease-spring ${
        phase === 'leave' ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 select-none whitespace-nowrap text-[150px] font-black leading-none tracking-tighter text-transparent [-webkit-text-stroke:1.5px_rgba(204,255,0,0.14)] sm:text-[260px]"
      >
        continuum
      </span>
      <div className="relative animate-pop">
        <Mascot mood="cheer" className="w-40 sm:w-52" />
      </div>
      <div className="relative animate-fade-up" style={{ animationDelay: '250ms' }}>
        <p className="text-[34px] font-bold tracking-tighter sm:text-5xl">Continuum</p>
        <p className="mt-2 text-[15px] text-white/75">Kebiasaan baik, tanpa rasa bersalah.</p>
      </div>
    </div>
  );
}
