'use client';

import { Mascot, MascotMood } from '@/components/Mascot';

interface AuthMascotProps {
  passwordFocused: boolean;
  submitting: boolean;
  error: string | null;
}

/** Conti perched on top of the login and register cards: hides its eyes while a password is typed, thinks while waiting, worries on errors. */
export function AuthMascot({ passwordFocused, submitting, error }: AuthMascotProps) {
  const mood: MascotMood = error ? 'oops' : submitting ? 'thinking' : passwordFocused ? 'shy' : 'happy';
  return (
    <div className="force-light pointer-events-none absolute -top-[92px] left-1/2 w-[104px] -translate-x-1/2">
      <Mascot mood={mood} follow={mood === 'happy'} className="pointer-events-auto" />
    </div>
  );
}
