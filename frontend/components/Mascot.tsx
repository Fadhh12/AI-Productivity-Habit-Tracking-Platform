'use client';

import { useState } from 'react';

export type MascotMood = 'happy' | 'cheer' | 'sleepy';

interface MascotProps {
  mood?: MascotMood;
  className?: string;
  /** When true the mascot is a button: tapping makes it hop. */
  interactive?: boolean;
}

const INK = '#16171D';

/**
 * "Conti", the Continuum mascot: a little lime sprout-blob. Blinks, sways its sprout and floats on its own;
 * cheers with raised arms when the day is done and dozes off late at night.
 * All motion is CSS (see .mascot-* in globals.css) and stops under prefers-reduced-motion.
 */
export function Mascot({ mood = 'happy', className = '', interactive = false }: MascotProps) {
  const [hop, setHop] = useState(false);

  function onTap() {
    if (hop) return;
    setHop(true);
    navigator.vibrate?.(15);
    setTimeout(() => setHop(false), 800);
  }

  const cheer = mood === 'cheer';
  const sleepy = mood === 'sleepy';

  const art = (
    <svg viewBox="0 0 160 170" className="h-auto w-full overflow-visible" role="img" aria-label="Conti, maskot Continuum">
      <defs>
        <radialGradient id="conti-body" cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#E4FF5E" />
          <stop offset="55%" stopColor="#CCFF00" />
          <stop offset="100%" stopColor="#A9D800" />
        </radialGradient>
      </defs>

      <ellipse cx="80" cy="158" rx="38" ry="7" fill="rgba(0,0,0,0.22)" className="mascot-shadow" />

      <g className={hop ? 'mascot-hop' : 'mascot-float'}>
        {/* arms sit behind the body */}
        <g style={{ transformOrigin: '36px 100px', transform: cheer ? 'rotate(150deg)' : 'rotate(14deg)', transition: 'transform 0.6s cubic-bezier(0.32, 0.72, 0, 1)' }}>
          <ellipse cx="30" cy="112" rx="10" ry="16" fill="#B4E100" />
        </g>
        <g style={{ transformOrigin: '124px 100px', transform: cheer ? 'rotate(-150deg)' : 'rotate(-14deg)', transition: 'transform 0.6s cubic-bezier(0.32, 0.72, 0, 1)' }}>
          <ellipse cx="130" cy="112" rx="10" ry="16" fill="#B4E100" />
        </g>

        {/* feet */}
        <ellipse cx="62" cy="152" rx="13" ry="7" fill="#A9D800" />
        <ellipse cx="98" cy="152" rx="13" ry="7" fill="#A9D800" />

        {/* body */}
        <path
          d="M80 46 C118 46 132 74 132 108 C132 140 110 156 80 156 C50 156 28 140 28 108 C28 74 42 46 80 46 Z"
          fill="url(#conti-body)"
        />
        <ellipse cx="80" cy="128" rx="30" ry="20" fill="#FFFFFF" opacity="0.16" />
        <ellipse cx="56" cy="72" rx="13" ry="7" fill="#FFFFFF" opacity="0.4" transform="rotate(-28 56 72)" />

        {/* sprout */}
        <g className="mascot-sprout">
          <path d="M80 48 C80 38 82 32 87 25" stroke="#3E7D1B" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M87 25 C97 15 111 19 113 30 C102 35 91 33 87 25 Z" fill="#5BB52A" />
          <path d="M83 35 C74 26 61 28 59 39 C70 43 80 41 83 35 Z" fill="#7AD33C" />
        </g>

        {/* face */}
        {sleepy ? (
          <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
            <path d="M52 94 Q60 100 68 94" />
            <path d="M92 94 Q100 100 108 94" />
          </g>
        ) : cheer ? (
          <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round">
            <path d="M52 96 Q60 84 68 96" />
            <path d="M92 96 Q100 84 108 96" />
          </g>
        ) : (
          <g className="mascot-blink">
            <circle cx="60" cy="94" r="7.5" fill={INK} />
            <circle cx="100" cy="94" r="7.5" fill={INK} />
            <circle cx="62.6" cy="91" r="2.6" fill="#FFFFFF" />
            <circle cx="102.6" cy="91" r="2.6" fill="#FFFFFF" />
          </g>
        )}
        <ellipse cx="46" cy="108" rx="7.5" ry="4.8" fill="#FF8FA8" opacity="0.6" />
        <ellipse cx="114" cy="108" rx="7.5" ry="4.8" fill="#FF8FA8" opacity="0.6" />
        {cheer ? (
          <g>
            <path d="M68 106 Q80 128 92 106 Z" fill={INK} />
            <ellipse cx="80" cy="116" rx="6" ry="4" fill="#FF7A93" />
          </g>
        ) : sleepy ? (
          <path d="M75 110 Q80 113 85 110" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M70 108 Q80 118 90 108" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
        )}

        {sleepy && (
          <g fill={INK} opacity="0.55" fontWeight="700" fontFamily="inherit">
            <text x="126" y="60" fontSize="16" className="mascot-z">z</text>
            <text x="138" y="44" fontSize="12" className="mascot-z" style={{ animationDelay: '0.6s' }}>z</text>
          </g>
        )}
      </g>
    </svg>
  );

  if (!interactive) return <div className={className}>{art}</div>;

  return (
    <button type="button" onClick={onTap} aria-label="Sapa Conti" className={`${className} block cursor-pointer select-none rounded-full outline-offset-4`}>
      {art}
    </button>
  );
}
