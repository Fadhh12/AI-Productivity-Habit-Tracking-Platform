import { Notification } from '@/lib/types';

export interface NotificationMeta {
  label: string;
  /** Material Symbols icon name. */
  icon: string;
  /** Tailwind classes for the round icon badge (background + icon colour). */
  tone: string;
  /** In-app page opened when the notification is tapped. */
  href: string;
}

const META: Record<string, NotificationMeta> = {
  habit_reminder: { label: 'Pengingat habit', icon: 'check_circle', tone: 'bg-accent-mint text-accent-mint-text', href: '/habit-tracker' },
  activity_reminder: { label: 'Pengingat aktivitas', icon: 'schedule', tone: 'bg-accent-terracotta text-accent-terracotta-text', href: '/activity-logs' },
  insight_weekly_win: { label: 'Rangkuman minggu', icon: 'auto_awesome', tone: 'bg-accent-lavender text-accent-lavender-text', href: '/reports' },
  insight_pattern: { label: 'Pola dari Coach', icon: 'insights', tone: 'bg-accent-lavender text-accent-lavender-text', href: '/reports' },
  insight_comeback: { label: 'Coach Continuum', icon: 'psychology', tone: 'bg-accent-lavender text-accent-lavender-text', href: '/coach' },
  challenge_complete: { label: 'Tantangan selesai', icon: 'emoji_events', tone: 'bg-accent-lime text-text-primary', href: '/today' },
  calendar_sync: { label: 'Google Calendar', icon: 'event', tone: 'bg-surface-container text-text-secondary', href: '/activity-logs' },
  rollup_failed: { label: 'Laporan bulanan', icon: 'sync_problem', tone: 'bg-accent-terracotta text-accent-terracotta-text', href: '/reports' },
  test_push: { label: 'Notifikasi aktif', icon: 'notifications_active', tone: 'bg-accent-mint text-accent-mint-text', href: '/settings' },
};

const DEFAULT_META: NotificationMeta = {
  label: 'Continuum',
  icon: 'notifications',
  tone: 'bg-surface-container text-text-secondary',
  href: '/today',
};

/** AI-phrased variants are stored with an `ai_` prefix; the look is the same, only the badge differs. */
export function notificationMeta(type: string): NotificationMeta {
  return META[type.replace(/^ai_/, '')] ?? DEFAULT_META;
}

export function isAiNotification(n: Notification): boolean {
  return n.type.startsWith('ai_');
}

/** "Baru saja", "5 mnt lalu", "3 jam lalu", otherwise a short date. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60000);
  if (minutes < 1) return 'Baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return then.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export interface NotificationGroup {
  label: string;
  items: Notification[];
}

/** Groups (already newest-first) notifications into Hari ini / Kemarin / Sebelumnya by the viewer's local calendar day. */
export function groupNotifications(list: Notification[], now: Date = new Date()): NotificationGroup[] {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const buckets: NotificationGroup[] = [
    { label: 'Hari ini', items: [] },
    { label: 'Kemarin', items: [] },
    { label: 'Sebelumnya', items: [] },
  ];
  for (const n of list) {
    const t = new Date(n.createdAt).getTime();
    if (t >= startOfToday) buckets[0].items.push(n);
    else if (t >= startOfToday - dayMs) buckets[1].items.push(n);
    else buckets[2].items.push(n);
  }
  return buckets.filter((b) => b.items.length > 0);
}
