'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { Notification } from '@/lib/types';

export function TopHeader() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<Notification[]>('/api/notifications')
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function onOpen() {
    setOpen((v) => !v);
  }

  async function onMarkRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // Non-critical — a failed mark-read simply leaves the badge visible until next refresh.
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayName = user?.email.split('@')[0] ?? '';
  const memberSince = user ? new Date(user.createdAt).getFullYear() : '';

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-20 items-center justify-between bg-surface/80 px-space-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:left-72 lg:px-space-xl">
      <div className="flex max-w-lg flex-1 items-center gap-space-md">
        <div className="relative flex w-full items-center">
          <span className="material-symbols-outlined absolute left-space-md text-[20px] text-text-muted">search</span>
          <input
            className="w-full rounded-full bg-surface-container-low py-space-sm pl-11 pr-space-md font-body-sm text-body-sm text-on-surface placeholder:text-text-muted focus:bg-surface-card focus:outline-none"
            placeholder="Cari aktivitas, habit, atau goal..."
            type="text"
          />
        </div>
      </div>
      <div className="flex items-center gap-space-lg">
        <div className="relative" ref={boxRef}>
          <button
            className="relative rounded-full bg-surface-container-low p-space-sm text-on-surface transition-colors hover:bg-surface-container-high"
            onClick={onOpen}
            type="button"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-accent-terracotta-text" />
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-12 z-50 max-h-96 w-80 overflow-y-auto rounded-lg bg-surface-card p-space-sm shadow-[0_12px_32px_-4px_rgba(22,23,29,0.08)]">
              <p className="px-space-sm py-1 font-label-md text-label-md font-semibold text-text-primary">Notifikasi</p>
              {notifications.length === 0 ? (
                <p className="px-space-sm py-4 text-center font-body-sm text-body-sm text-text-muted">
                  Belum ada notifikasi.
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onMarkRead(n.id)}
                    className={`flex w-full flex-col items-start gap-0.5 rounded-xl px-space-sm py-space-sm text-left transition-colors hover:bg-surface-container-low ${
                      n.read ? '' : 'bg-accent-lavender/40'
                    }`}
                    type="button"
                  >
                    <span className="font-body-sm text-body-sm text-text-primary">{n.message}</span>
                    <span className="font-caption text-caption text-text-muted">
                      {new Date(n.createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-space-sm pl-space-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tertiary-container font-label-md text-label-md font-bold text-on-tertiary-container">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="font-label-md text-label-md font-semibold text-text-primary">{displayName}</span>
            <span className="font-label-sm text-label-sm font-medium text-accent-lavender-text">
              Member sejak {memberSince}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
