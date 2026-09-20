'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePlan } from '@/lib/plan';
import { Avatar, displayNameOf } from '@/components/Avatar';

const ITEMS = [
  { href: '/account', icon: 'person', label: 'Akun saya' },
  { href: '/plus', icon: 'workspace_premium', label: 'Continuum Plus' },
  { href: '/settings', icon: 'settings', label: 'Pengaturan' },
];

/** Avatar button in the header that opens the account menu (profile, plan, settings, sign out). */
export function AccountMenu() {
  const { user, logout } = useAuth();
  const { isPlus } = usePlan();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;
  const name = displayNameOf(user);
  const memberSince = new Date(user.createdAt).getFullYear();

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menu akun"
        className="flex min-h-[44px] items-center gap-space-sm rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-surface-container-low sm:pr-space-sm"
      >
        <Avatar user={user} size="sm" />
        <span className="hidden flex-col text-left sm:flex">
          <span className="max-w-[9rem] truncate font-label-md text-label-md font-semibold text-text-primary">{name}</span>
          <span className="font-label-sm text-label-sm font-medium text-accent-lavender-text">
            {isPlus ? 'Plus' : `Member sejak ${memberSince}`}
          </span>
        </span>
        <span className="hidden sm:block">
          <span className="material-symbols-outlined text-[18px] text-text-muted" aria-hidden="true">
            expand_more
          </span>
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-14 z-50 w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl bg-surface-card shadow-[0_16px_40px_-8px_rgba(22,23,29,0.25)]"
        >
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-space-sm border-b border-border-subtle p-space-md hover:bg-surface-container-low"
          >
            <Avatar user={user} size="md" />
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-label-lg text-label-lg font-bold text-text-primary">{name}</span>
              <span className="truncate font-caption text-caption text-text-secondary">{user.email}</span>
            </span>
          </Link>
          <div className="flex flex-col p-space-sm">
            {ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex min-h-[44px] items-center gap-space-sm rounded-xl px-space-sm font-label-md text-label-md text-text-primary hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px] text-text-secondary" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                void logout();
              }}
              className="flex min-h-[44px] items-center gap-space-sm rounded-xl px-space-sm text-left font-label-md text-label-md text-text-primary hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px] text-text-secondary" aria-hidden="true">
                logout
              </span>
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
