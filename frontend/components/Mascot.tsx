'use client';

import { useEffect, useRef, useState } from 'react';

export type MascotMood = 'happy' | 'cheer' | 'sleepy' | 'thinking' | 'oops' | 'shy' | 'love';

interface MascotProps {
  mood?: MascotMood;
  className?: string;
  /** When true the mascot is a button: tapping makes it hop. */
  interactive?: boolean;
  /** Eyes follow the pointer (only while `happy`). Defaults to on for interactive mascots. */
  follow?: boolean;
  /** Change this number to make the mascot hop from outside (for example after a check-in). */
  pulse?: number;
}

const INK = '#16171D';
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

/**
 * "Conti", the Continuum mascot: a little lime sprout-blob. It blinks, sways its sprout and floats by itself, its
 * eyes follow the pointer, and it changes face with `mood`: cheers, dozes, thinks, worries, hides its eyes, gets
 * heart eyes. All motion is CSS (.mascot-* in globals.css) and stops under prefers-reduced-motion.
 */
export function Mascot({ mood = 'happy', className = '', interactive = false, follow, pulse = 0 }: MascotProps) {
  const [hop, setHop] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const eyesRef = useRef<SVGGElement>(null);
  const shouldFollow = (follow ?? interactive) && mood === 'happy';

  function doHop() {
    setHop(true);
    setTimeout(() => setHop(false), 800);
  }

  function onTap() {
    if (hop) return;
    navigator.vibrate?.(15);
    doHop();
  }

  // External hop trigger.
  useEffect(() => {
    if (!pulse) return;
    setHop(true);
    const t = setTimeout(() => setHop(false), 800);
    return () => clearTimeout(t);
  }, [pulse]);

  // Pupils drift toward the pointer. Written straight to the DOM so pointer moves never re-render React.
  useEffect(() => {
    const eyes = eyesRef.current;
    if (!eyes) return;
    eyes.style.transform = mood === 'thinking' ? 'translate(4px, -4px)' : 'translate(0, 0)';
    if (!shouldFollow || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const svg = svgRef.current;
        if (!svg) return;
        const r = svg.getBoundingClientRect();
        const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / 260));
        const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height * 0.55)) / 260));
        eyes.style.transform = `translate(${dx * 3.5}px, ${dy * 3}px)`;
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [shouldFollow, mood]);

  const armsUp = mood === 'cheer';
  const motion = hop ? 'mascot-hop' : mood === 'cheer' ? 'mascot-cheer' : mood === 'oops' ? 'mascot-shake' : 'mascot-float';
  const armStyle = (origin: string, deg: number): React.CSSProperties => ({
    transformOrigin: origin,
    transform: `rotate(${deg}deg)`,
    transition: `transform 0.6s ${EASE}`,
  });

  const art = (
    <svg ref={svgRef} viewBox="0 0 160 170" className="h-auto w-full overflow-visible" role="img" aria-label="Conti, maskot Continuum">
      <defs>
        <radialGradient id="conti-body" cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#E4FF5E" />
          <stop offset="55%" stopColor="#CCFF00" />
          <stop offset="100%" stopColor="#A9D800" />
        </radialGradient>
      </defs>

      <ellipse cx="80" cy="158" rx="38" ry="7" fill="rgba(0,0,0,0.22)" className="mascot-shadow" />

      <g className={motion}>
        {/* arms sit behind the body */}
        <g style={armStyle('36px 100px', armsUp ? 150 : 14)}>
          <ellipse cx="30" cy="112" rx="10" ry="16" fill="#B4E100" />
        </g>
        <g style={armStyle('124px 100px', armsUp ? -150 : -14)}>
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

        {/* eyes */}
        {mood === 'sleepy' && (
          <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
            <path d="M52 94 Q60 100 68 94" />
            <path d="M92 94 Q100 100 108 94" />
          </g>
        )}
        {mood === 'cheer' && (
          <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round">
            <path d="M52 96 Q60 84 68 96" />
            <path d="M92 96 Q100 84 108 96" />
          </g>
        )}
        {mood === 'love' && (
          <g fill="#FF4D79" className="mascot-beat">
            <path d="M60 104 C50 96 50 86 57 86 C60 86 60 89 60 90 C60 89 60 86 63 86 C70 86 70 96 60 104 Z" />
            <path d="M100 104 C90 96 90 86 97 86 C100 86 100 89 100 90 C100 89 100 86 103 86 C110 86 110 96 100 104 Z" />
          </g>
        )}
        {(mood === 'happy' || mood === 'thinking' || mood === 'oops') && (
          <g ref={eyesRef} style={{ transition: 'transform 0.14s ease-out' }}>
            <g className="mascot-blink">
              <circle cx="60" cy="94" r={mood === 'oops' ? 6 : 7.5} fill={INK} />
              <circle cx="100" cy="94" r={mood === 'oops' ? 6 : 7.5} fill={INK} />
              <circle cx="62.6" cy="91" r="2.6" fill="#FFFFFF" />
              <circle cx="102.6" cy="91" r="2.6" fill="#FFFFFF" />
            </g>
          </g>
        )}
        {mood === 'oops' && (
          <g fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round">
            <path d="M50 78 Q58 72 68 76" />
            <path d="M92 76 Q102 72 110 78" />
          </g>
        )}
        {mood === 'shy' && (
          <g className="mascot-cover">
            <circle cx="60" cy="94" r="13" fill="#B4E100" stroke="#8FBF00" strokeWidth="2" />
            <circle cx="100" cy="94" r="13" fill="#B4E100" stroke="#8FBF00" strokeWidth="2" />
            <path d="M52 92 v6 M60 90 v8 M68 92 v6 M92 92 v6 M100 90 v8 M108 92 v6" stroke="#8FBF00" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}

        {/* cheeks */}
        <ellipse cx="46" cy="108" rx="7.5" ry="4.8" fill="#FF8FA8" opacity={mood === 'shy' || mood === 'love' ? 0.9 : 0.6} />
        <ellipse cx="114" cy="108" rx="7.5" ry="4.8" fill="#FF8FA8" opacity={mood === 'shy' || mood === 'love' ? 0.9 : 0.6} />

        {/* mouth */}
        {mood === 'cheer' && (
          <g>
            <path d="M68 106 Q80 128 92 106 Z" fill={INK} />
            <ellipse cx="80" cy="116" rx="6" ry="4" fill="#FF7A93" />
          </g>
        )}
        {mood === 'sleepy' && <path d="M75 110 Q80 113 85 110" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />}
        {mood === 'thinking' && <ellipse cx="84" cy="112" rx="4" ry="3.4" fill={INK} />}
        {mood === 'oops' && <path d="M69 116 Q74 109 80 115 T91 115" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />}
        {(mood === 'happy' || mood === 'shy' || mood === 'love') && (
          <path d="M70 108 Q80 118 90 108" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
        )}

        {/* extras */}
        {mood === 'sleepy' && (
          <g fill={INK} opacity="0.55" fontWeight="700" fontFamily="inherit">
            <text x="126" y="60" fontSize="16" className="mascot-z">z</text>
            <text x="138" y="44" fontSize="12" className="mascot-z" style={{ animationDelay: '0.6s' }}>z</text>
          </g>
        )}
        {mood === 'thinking' && (
          <g className="mascot-think">
            <circle cx="126" cy="62" r="3" fill="#FFFFFF" />
            <circle cx="136" cy="50" r="4.5" fill="#FFFFFF" />
            <ellipse cx="150" cy="30" rx="16" ry="12" fill="#FFFFFF" />
            <text x="150" y="35" fontSize="15" fontWeight="800" textAnchor="middle" fill="#6D3BD7" fontFamily="inherit">?</text>
          </g>
        )}
        {mood === 'oops' && (
          <path d="M122 66 C118 74 116 78 122 82 C128 78 126 74 122 66 Z" fill="#7DD3FC" className="mascot-drip" />
        )}
        {mood === 'love' && (
          <g fill="#FF4D79">
            <path d="M118 52 C112 46 112 40 116 40 C118 40 118 42 118 43 C118 42 118 40 120 40 C124 40 124 46 118 52 Z" className="mascot-heart-rise" />
            <path d="M40 56 C36 52 36 47 39 47 C41 47 41 49 41 49 C41 49 41 47 43 47 C46 47 46 52 40 56 Z" className="mascot-heart-rise" style={{ animationDelay: '0.9s' }} />
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
