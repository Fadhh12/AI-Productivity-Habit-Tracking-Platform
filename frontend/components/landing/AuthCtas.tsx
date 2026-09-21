'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

interface AuthCtasProps {
  /** "nav" is compact, "hero" is the large pair. */
  size?: 'nav' | 'hero';
  className?: string;
}

/** Signup / login for guests, a single dashboard link for signed-in users. Same labels everywhere on the page. */
export function AuthCtas({ size = 'hero', className = '' }: AuthCtasProps) {
  const { user, loading } = useAuth();
  const big = size === 'hero';
  const pad = big ? 'px-6 py-3.5 text-[15px]' : 'px-4 py-2 text-[13px]';

  const primary = (href: string, label: string) => (
    <Link
      href={href}
      className={`press group inline-flex items-center gap-2.5 whitespace-nowrap rounded-full bg-accent-lime font-bold text-sidebar-dark hover:bg-accent-lime-dim ${pad} ${big ? 'pr-2' : 'pr-1.5'}`}
    >
      {label}
      <span
        className={`flex items-center justify-center rounded-full bg-sidebar-dark text-accent-lime transition-transform duration-500 ease-spring group-hover:translate-x-0.5 ${big ? 'h-9 w-9' : 'h-6 w-6'}`}
      >
        <span className={`material-symbols-outlined ${big ? 'text-[20px]' : 'text-[15px]'}`} aria-hidden="true">
          arrow_forward
        </span>
      </span>
    </Link>
  );

  return (
    <div
      className={`flex items-center gap-3 transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'} ${className}`}
    >
      {user ? (
        primary('/today', 'Buka dashboard')
      ) : (
        <>
          <Link
            href="/login"
            className={`press whitespace-nowrap rounded-full font-semibold text-white/80 ring-1 ring-white/15 hover:bg-white/5 hover:text-white ${pad}`}
          >
            Masuk
          </Link>
          {primary('/register', 'Mulai gratis')}
        </>
      )}
    </div>
  );
}
