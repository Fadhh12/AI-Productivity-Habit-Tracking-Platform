'use client';

import { useEffect, useState } from 'react';

const COLORS = ['#CCFF00', '#16171D', '#6D28D9', '#FB923C', '#10B981', '#A78BFA'];
const COUNT = 36;

function makePieces() {
  return Array.from({ length: COUNT }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    dx: Math.round((Math.random() - 0.5) * 520),
    up: -Math.round(120 + Math.random() * 220),
    down: Math.round(120 + Math.random() * 280),
    rot: Math.round((Math.random() - 0.5) * 900),
    delay: Math.round(Math.random() * 90),
    round: i % 3 === 0,
  }));
}

interface ConfettiProps {
  /** Changes every time a burst should play. 0 means nothing yet. */
  burst: number;
  /** Where the pieces start, as viewport percentages. */
  originX?: number;
  originY?: number;
}

/** A short confetti burst made of CSS animations (transform and opacity only). Skipped when the OS asks for less motion. */
export function Confetti({ burst, originX = 50, originY = 60 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ReturnType<typeof makePieces> | null>(null);

  useEffect(() => {
    if (burst === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Random values are drawn here (not during render) so every burst gets its own scatter.
    setPieces(makePieces());
    const t = setTimeout(() => setPieces(null), 1800);
    return () => clearTimeout(t);
  }, [burst]);

  if (!pieces) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={`${burst}-${p.id}`}
          className="absolute block h-3 w-2 animate-confetti"
          style={
            {
              left: `${originX}%`,
              top: `${originY}%`,
              backgroundColor: p.color,
              borderRadius: p.round ? '9999px' : '2px',
              animationDelay: `${p.delay}ms`,
              '--dx': `${p.dx}px`,
              '--up': `${p.up}px`,
              '--down': `${p.down}px`,
              '--rot': `${p.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
