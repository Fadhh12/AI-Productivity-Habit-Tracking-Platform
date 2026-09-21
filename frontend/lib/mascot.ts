'use client';

import { useEffect, useRef, useState } from 'react';
import type { MascotMood } from '@/components/Mascot';

/** Things that happen in the app that the mascot should react to. */
export type MascotEvent =
  | 'checkin'
  | 'allDone'
  | 'badge'
  | 'thinking'
  | 'idle'
  | 'saved'
  | 'created'
  | 'error'
  | 'talk';

const EVENT_NAME = 'continuum:mascot';

/** Call from anywhere (event handlers, effects). Safe on the server: it does nothing there. */
export function emitMascot(event: MascotEvent, message?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { event, message } }));
}

export interface MascotReaction {
  mood: MascotMood;
  message: string | null;
  /** Increases on every event so the mascot can hop each time. */
  pulse: number;
}

const LINES: Record<Exclude<MascotEvent, 'idle'>, string[]> = {
  checkin: ['Mantap!', 'Satu lagi beres.', 'Keren, lanjut!', 'Pelan tapi pasti.'],
  allDone: ['Semua selesai hari ini!', 'Kamu luar biasa hari ini.'],
  badge: ['Lencana baru!', 'Wah, pencapaian baru!'],
  thinking: ['Hmm, sebentar ya...', 'Lagi kupikirkan...'],
  saved: ['Tersimpan.', 'Sudah kucatat.'],
  created: ['Baru dibuat, semangat!', 'Mulai yang baik!'],
  error: ['Ups, ada kendala. Coba lagi ya.', 'Tidak apa-apa, coba sekali lagi.'],
  talk: ['Nah, ini jawabannya.', 'Sudah siap.'],
};

const REACTION: Record<Exclude<MascotEvent, 'idle'>, { mood: MascotMood; ms: number }> = {
  checkin: { mood: 'happy', ms: 1900 },
  allDone: { mood: 'cheer', ms: 4200 },
  badge: { mood: 'cheer', ms: 4200 },
  thinking: { mood: 'thinking', ms: 30000 },
  saved: { mood: 'love', ms: 2400 },
  created: { mood: 'cheer', ms: 2600 },
  error: { mood: 'oops', ms: 4200 },
  talk: { mood: 'happy', ms: 2000 },
};

/**
 * Subscribes to mascot events and returns the current reaction, or null when the mascot is at rest.
 * `thinking` lasts until an `idle` event (or 30s as a safety net); everything else fades after a moment.
 */
export function useMascotReaction(): MascotReaction | null {
  const [reaction, setReaction] = useState<MascotReaction | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useRef(0);

  useEffect(() => {
    function onEvent(e: Event) {
      const { event, message } = (e as CustomEvent<{ event: MascotEvent; message?: string }>).detail;
      if (timer.current) clearTimeout(timer.current);
      if (event === 'idle') {
        setReaction(null);
        return;
      }
      const conf = REACTION[event];
      const pool = LINES[event];
      pulse.current += 1;
      setReaction({ mood: conf.mood, message: message ?? pool[Math.floor(Math.random() * pool.length)], pulse: pulse.current });
      timer.current = setTimeout(() => setReaction(null), conf.ms);
    }
    window.addEventListener(EVENT_NAME, onEvent);
    return () => {
      window.removeEventListener(EVENT_NAME, onEvent);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return reaction;
}
