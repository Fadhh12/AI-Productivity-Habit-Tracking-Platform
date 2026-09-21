'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Notification } from '@/lib/types';
import { enablePush, getPushState, PushState } from '@/lib/push';
import { groupNotifications, isAiNotification, notificationMeta, relativeTime } from '@/lib/notifications';

type Filter = 'all' | 'unread';

/**
 * Bell + notification centre. On phones the panel is a compact popover under
 * the header (tap outside to close); from `sm` up it is a dropdown anchored
 * to the bell. Items are grouped by day and open the page they relate to.
 */
export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [pushState, setPushState] = useState<PushState | null>(null);
  const [pushBusy, setPushBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    apiFetch<Notification[]>('/api/notifications')
      .then(setNotifications)
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    load(); // pick up anything that arrived since the page loaded
    getPushState().then(setPushState).catch(() => setPushState(null));
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
  }, [open, load]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const visible = useMemo(
    () => (filter === 'unread' ? notifications.filter((n) => !n.read) : notifications),
    [notifications, filter],
  );
  const groups = useMemo(() => groupNotifications(visible), [visible]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    } catch {
      // Non-critical: a failed mark-read only leaves the dot visible until the next refresh.
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
    } catch {
      // Same as above; the next load restores the true state.
    }
  }

  async function turnOnPush() {
    setPushBusy(true);
    try {
      setPushState(await enablePush());
    } catch {
      setPushState(await getPushState().catch(() => null));
    } finally {
      setPushBusy(false);
    }
  }

  function onSelect(n: Notification) {
    if (!n.read) void markRead(n.id);
    setOpen(false);
    router.push(notificationMeta(n.type).href);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-low text-on-surface press hover:bg-surface-container-high"
        onClick={() => setOpen((v) => !v)}
        aria-label={unreadCount > 0 ? `Notifikasi, ${unreadCount} belum dibaca` : 'Notifikasi'}
        aria-expanded={open}
        type="button"
      >
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
          {unreadCount > 0 ? 'notifications_active' : 'notifications'}
        </span>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent-terracotta-text px-1 text-[10px] font-bold leading-none text-white ring-2 ring-surface">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 top-20 z-40 sm:hidden" aria-hidden="true" onClick={() => setOpen(false)} />
          <div className="fixed right-3 top-[76px] z-50 flex w-[min(22rem,calc(100vw-1.5rem))] animate-scale-in origin-top-right max-h-[min(26rem,calc(100dvh-84px-120px))] flex-col overflow-hidden rounded-2xl bg-surface-card shadow-[0_16px_40px_-8px_rgba(22,23,29,0.25)] sm:absolute sm:right-0 sm:top-14 sm:max-h-[32rem] sm:w-[26rem]">
            <div className="flex items-center justify-between gap-space-sm border-b border-border-subtle px-space-md py-space-sm">
              <div className="flex items-baseline gap-2">
                <h2 className="font-headline-sm text-headline-sm font-bold text-text-primary">Notifikasi</h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-accent-lavender px-2 py-0.5 font-label-sm text-label-sm text-accent-lavender-text">
                    {unreadCount} baru
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="min-h-[40px] shrink-0 rounded-full px-3 text-[13px] font-semibold text-tertiary hover:bg-accent-lavender disabled:text-text-muted disabled:hover:bg-transparent sm:min-h-[36px] sm:text-label-sm"
              >
                Tandai semua dibaca
              </button>
            </div>

            <div className="flex gap-2 px-space-md py-space-sm" role="tablist" aria-label="Filter notifikasi">
              {(['all', 'unread'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => setFilter(f)}
                  className={`min-h-[40px] rounded-full px-4 text-[14px] font-semibold transition-colors sm:min-h-[36px] sm:text-label-md ${
                    filter === f ? 'bg-sidebar-dark text-white' : 'bg-surface-container-low text-text-secondary hover:bg-surface-container'
                  }`}
                >
                  {f === 'all' ? 'Semua' : 'Belum dibaca'}
                </button>
              ))}
            </div>

            {(pushState === 'off' || pushState === 'needs-install') && (
              <div className="mx-space-md mb-space-xs flex items-center gap-space-sm rounded-xl bg-accent-lime/40 px-space-sm py-space-xs">
                <span className="material-symbols-outlined text-[20px] text-text-primary" aria-hidden="true">
                  notifications_active
                </span>
                <p className="min-w-0 flex-1 text-[12px] leading-4 text-text-primary">
                  {pushState === 'off'
                    ? 'Aktifkan notifikasi HP supaya pengingat tetap masuk saat app ditutup.'
                    : 'Pasang app ke layar utama untuk menerima notifikasi HP.'}
                </p>
                {pushState === 'off' && (
                  <button
                    type="button"
                    onClick={turnOnPush}
                    disabled={pushBusy}
                    className="min-h-[36px] shrink-0 rounded-full bg-sidebar-dark px-3 text-[12px] font-bold text-white disabled:opacity-60"
                  >
                    {pushBusy ? '…' : 'Aktifkan'}
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto overscroll-contain px-space-sm pb-space-sm">
              {!loaded ? (
                <p className="px-space-sm py-8 text-center font-body-sm text-body-sm text-text-muted">Memuat…</p>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center gap-1 px-space-md py-10 text-center">
                  <span className="material-symbols-outlined text-[36px] text-text-muted" aria-hidden="true">
                    {filter === 'unread' ? 'done_all' : 'notifications_off'}
                  </span>
                  <p className="font-label-md text-label-md font-semibold text-text-primary">
                    {filter === 'unread' ? 'Semua sudah dibaca' : 'Belum ada notifikasi'}
                  </p>
                  <p className="font-body-sm text-body-sm text-text-muted">
                    {filter === 'unread' ? 'Kamu sudah up to date.' : 'Pengingat dan insight dari Coach akan muncul di sini.'}
                  </p>
                </div>
              ) : (
                groups.map((group) => (
                  <section key={group.label} className="flex flex-col">
                    <h3 className="px-space-sm pb-1 pt-space-sm text-[12px] font-semibold uppercase tracking-wide text-text-muted">
                      {group.label}
                    </h3>
                    {group.items.map((n) => {
                      const meta = notificationMeta(n.type);
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => onSelect(n)}
                          className={`flex w-full items-start gap-space-sm rounded-xl px-space-sm py-space-sm text-left press hover:bg-surface-container-low active:bg-surface-container ${
                            n.read ? '' : 'bg-accent-lavender/30'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[20px] ${meta.tone}`}
                            aria-hidden="true"
                          >
                            {meta.icon}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[14px] font-semibold text-text-primary sm:text-label-md">
                                {meta.label}
                              </span>
                              {isAiNotification(n) && <span className="badge-ai shrink-0">✨ AI</span>}
                              <span className="ml-auto shrink-0 text-[12px] text-text-muted">
                                {relativeTime(n.createdAt)}
                              </span>
                            </span>
                            <span className="break-words text-[14px] leading-5 text-text-secondary sm:text-body-sm">{n.message}</span>
                          </span>
                          {!n.read && (
                            <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-terracotta-text" aria-label="Belum dibaca" />
                          )}
                        </button>
                      );
                    })}
                  </section>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
