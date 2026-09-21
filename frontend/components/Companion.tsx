'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Mascot } from '@/components/Mascot';
import { useMascotReaction } from '@/lib/mascot';
import { useCompanionEnabled } from '@/lib/companion';

/** Pages that already show their own Conti, so the floating one stays away. */
const OWN_MASCOT = ['/today', '/coach', '/achievements', '/habit-tracker'];

const SLEEP_AFTER_MS = 3 * 60 * 1000;

/** One short hello the first time each page is opened in a session. */
const PAGE_LINES: Record<string, string> = {
  '/habit-tracker': 'Mulai dari habit yang paling mudah dulu ya.',
  '/goals': 'Goal besar, langkah kecil.',
  '/activity-logs': 'Catat sekarang, biar tidak lupa nanti.',
  '/reports': 'Ini rangkuman perjalananmu.',
  '/coach': 'Tanya apa saja, aku temani.',
  '/achievements': 'Lihat sudah sampai mana kamu.',
  '/settings': 'Atur sesukamu, aku ikut.',
  '/plus': 'Fitur ekstra untuk yang butuh lebih.',
  '/account': 'Ini profilmu.',
};

const TIPS = [
  'Sudah minum air hari ini?',
  'Istirahat itu bagian dari rencana.',
  'Satu habit kecil lebih baik dari nol.',
  'Bolos sehari? Tidak apa-apa, lanjut besok.',
  'Coba tarik napas dalam sebentar.',
];

/**
 * A small floating Conti that lives on every page that does not already have its own in-page Conti.
 * It reacts to what the user does, greets each page once per session and dozes off when nothing happens for a while.
 */
export function Companion() {
  const pathname = usePathname();
  const enabled = useCompanionEnabled();
  const reaction = useMascotReaction();

  const [sleepy, setSleepy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [pulse, setPulse] = useState(0);
  const lastActive = useRef(0);
  const tipIndex = useRef(0);
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function say(text: string, ms = 3200) {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    setNote(text);
    setPulse((p) => p + 1);
    noteTimer.current = setTimeout(() => setNote(null), ms);
  }

  // Track activity: wake up on any input, fall asleep after a quiet spell.
  useEffect(() => {
    lastActive.current = Date.now();
    const onActivity = () => {
      lastActive.current = Date.now();
      setSleepy((was) => {
        if (was) queueMicrotask(() => say('Oh, hai lagi!', 2200));
        return false;
      });
    };
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    const check = setInterval(() => {
      if (Date.now() - lastActive.current > SLEEP_AFTER_MS) setSleepy(true);
    }, 15000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      clearInterval(check);
      if (noteTimer.current) clearTimeout(noteTimer.current);
    };
  }, []);

  // Greet a page the first time it is opened in this session.
  useEffect(() => {
    const line = PAGE_LINES[pathname ?? ''];
    if (!line) return;
    try {
      const key = `continuum_companion_seen_${pathname}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      return;
    }
    const t = setTimeout(() => say(line), 900);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!enabled || (pathname && OWN_MASCOT.includes(pathname))) return null;

  const message = reaction?.message ?? note;
  const mood = reaction?.mood ?? (sleepy ? 'sleepy' : 'happy');

  function onTap() {
    navigator.vibrate?.(12);
    say(TIPS[tipIndex.current++ % TIPS.length]);
  }

  return (
    <div
      className="force-light pointer-events-none fixed right-3 z-30 animate-slide-up lg:bottom-6 lg:right-6"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.6rem)' }}
    >
      <div className="relative">
        {message && (
          <div
            key={`${message}-${reaction?.pulse ?? pulse}`}
            role="status"
            className="pointer-events-none absolute bottom-9 right-[calc(100%-0.5rem)] w-max max-w-[190px] animate-scale-in rounded-2xl rounded-br-md bg-white px-3 py-2 text-[12px] font-semibold leading-snug text-[#16171D] shadow-[0_12px_28px_-10px_rgba(22,23,29,0.4)]"
            style={{ transformOrigin: 'bottom right' }}
          >
            {message}
          </div>
        )}
        <button
          type="button"
          onClick={onTap}
          aria-label="Conti, teman maskotmu. Ketuk untuk sapaan"
          className="pointer-events-auto block w-16 select-none rounded-full outline-offset-2 lg:w-[72px]"
        >
          <Mascot mood={mood} follow pulse={reaction?.pulse ?? pulse} />
        </button>
      </div>
    </div>
  );
}
