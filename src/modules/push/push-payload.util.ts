export interface PushPayload {
  title: string;
  body: string;
  /** In-app path opened when the notification is tapped. */
  url: string;
  /** Same tag replaces an older notification instead of stacking. */
  tag: string;
}

const MAX_BODY_CHARS = 180;

function truncate(text: string): string {
  return text.length <= MAX_BODY_CHARS ? text : `${text.slice(0, MAX_BODY_CHARS - 1).trimEnd()}…`;
}

/** Maps an in-app notification (type + message) to what a phone should show and where a tap should go. */
export function buildPushPayload(type: string, message: string): PushPayload {
  const kind = type.replace(/^ai_/, '');
  const body = truncate(message);

  if (kind === 'insight_weekly_win') return { title: 'Rangkuman minggumu', body, url: '/reports', tag: kind };
  if (kind === 'insight_pattern') return { title: 'Pola yang Coach temukan', body, url: '/reports', tag: kind };
  if (kind === 'insight_comeback') return { title: 'Coach Continuum', body, url: '/today', tag: kind };
  if (kind === 'habit_reminder') return { title: 'Pengingat habit', body, url: '/habit-tracker', tag: 'habit_reminder' };
  if (kind === 'activity_reminder') return { title: 'Pengingat aktivitas', body, url: '/activity-logs', tag: 'activity_reminder' };
  if (kind === 'calendar_sync') return { title: 'Google Calendar', body, url: '/activity-logs', tag: kind };
  if (kind === 'test_push') return { title: 'Notifikasi Continuum aktif', body, url: '/settings', tag: kind };
  return { title: 'Continuum', body, url: '/today', tag: kind };
}

/** A push service answering 404/410 means the subscription is gone for good (app uninstalled, permission revoked). */
export function isExpiredSubscriptionError(error: unknown): boolean {
  const status = (error as { statusCode?: number }).statusCode;
  return status === 404 || status === 410;
}
