import { todayDateString } from './date';

/**
 * Small write queue for the two actions people do most while offline:
 * habit check-ins and creating activities. Requests are replayed in order once
 * the network is back; the server dedupes retries (natural unique index for
 * check-ins, Idempotency-Key for activities), so a replay can never double-write.
 */
export type QueuedKind = 'checkin' | 'activity';

export interface QueuedRequest {
  id: string;
  kind: QueuedKind;
  path: string;
  method: string;
  body: string;
  idempotencyKey: string;
  /** Device-local date when it was queued. A check-in replayed on a later day would land on the wrong day, so those are dropped instead. */
  localDate: string;
  createdAt: number;
}

export interface FlushResult {
  sent: number;
  dropped: number;
  remaining: number;
}

const QUEUE_KEY = 'continuum_offline_queue';
export const QUEUE_CHANGED_EVENT = 'continuum-queue-changed';
export const QUEUE_FLUSHED_EVENT = 'continuum-queue-flushed';
export const API_CACHE_NAME = 'continuum-api-v1';

function read(): QueuedRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedRequest[]) : [];
  } catch {
    return [];
  }
}

function write(items: QueuedRequest[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    // storage full or blocked — the request is simply not persisted
  }
  window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT));
}

export function pendingCount(): number {
  return read().length;
}

export function enqueue(item: Omit<QueuedRequest, 'id' | 'idempotencyKey' | 'localDate' | 'createdAt'>): QueuedRequest {
  const queued: QueuedRequest = {
    ...item,
    id: crypto.randomUUID(),
    idempotencyKey: crypto.randomUUID(),
    localDate: todayDateString(),
    createdAt: Date.now(),
  };
  write([...read(), queued]);
  return queued;
}

/** True when a fetch failed because there is no network (as opposed to the server answering with an error). */
export function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError;
}

/**
 * Replays the queue in order. `send` performs one request and throws on failure:
 * a network error stops the flush (keep the rest for later), any other error
 * means the server rejected it, so retrying would never help and it is dropped.
 */
export async function flushQueue(send: (req: QueuedRequest) => Promise<void>): Promise<FlushResult> {
  const items = read();
  let sent = 0;
  let dropped = 0;
  const today = todayDateString();

  for (const item of items) {
    if (item.kind === 'checkin' && item.localDate !== today) {
      remove(item.id);
      dropped += 1;
      continue;
    }
    try {
      await send(item);
      sent += 1;
      remove(item.id);
    } catch (err) {
      if (isNetworkError(err)) break;
      dropped += 1;
      remove(item.id);
    }
  }

  const remaining = pendingCount();
  window.dispatchEvent(new CustomEvent(QUEUE_FLUSHED_EVENT, { detail: { sent, dropped, remaining } }));
  return { sent, dropped, remaining };
}

function remove(id: string) {
  write(read().filter((r) => r.id !== id));
}

/** Wipes everything cached on this device for the signed-in user (queued writes and cached API responses). Called on login/logout so one account's data never shows for another. */
export async function clearOfflineData(): Promise<void> {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(QUEUE_CHANGED_EVENT));
  try {
    await caches.delete(API_CACHE_NAME);
  } catch {
    // Cache API unavailable (e.g. insecure context) — nothing to clear
  }
}
