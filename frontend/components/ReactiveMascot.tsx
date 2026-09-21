'use client';

import { Mascot, MascotMood } from '@/components/Mascot';
import { useMascotReaction } from '@/lib/mascot';

interface ReactiveMascotProps {
  /** Face at rest; any app reaction temporarily overrides it. */
  base?: MascotMood;
  className?: string;
  /** Show the one-line speech bubble that comes with a reaction. */
  bubble?: boolean;
}

/** An in-page Conti that mirrors whatever the app is doing (thinking, cheering, worried) with an optional speech bubble. */
export function ReactiveMascot({ base = 'happy', className = 'w-24', bubble = true }: ReactiveMascotProps) {
  const reaction = useMascotReaction();
  return (
    <div className="force-light relative shrink-0">
      {bubble && reaction?.message && (
        <div
          key={`${reaction.message}-${reaction.pulse}`}
          role="status"
          className="absolute -top-3 right-[70%] z-10 w-max max-w-[150px] animate-scale-in rounded-2xl rounded-br-md bg-white px-3 py-2 text-[12px] font-semibold leading-snug text-[#16171D] shadow-[0_12px_28px_-10px_rgba(22,23,29,0.5)] sm:max-w-[190px]"
          style={{ transformOrigin: 'bottom right' }}
        >
          {reaction.message}
        </div>
      )}
      <Mascot mood={reaction?.mood ?? base} interactive pulse={reaction?.pulse ?? 0} className={className} />
    </div>
  );
}
