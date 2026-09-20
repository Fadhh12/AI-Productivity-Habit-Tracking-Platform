'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { flushQueue, FlushResult, pendingCount, QUEUE_CHANGED_EVENT, QUEUE_FLUSHED_EVENT } from '@/lib/offlineQueue';

/** Shows connection state and the number of changes waiting to sync, and replays the queue as soon as the network returns. */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [result, setResult] = useState<FlushResult | null>(null);

  const flush = useCallback(async () => {
    if (pendingCount() === 0) return;
    await flushQueue((req) =>
      apiFetch(req.path, { method: req.method, body: req.body, idempotencyKey: req.idempotencyKey }).then(() => undefined),
    );
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    setPending(pendingCount());

    const onOnline = () => {
      setOnline(true);
      flush();
    };
    const onOffline = () => setOnline(false);
    const onChanged = () => setPending(pendingCount());
    const onFlushed = (e: Event) => {
      const detail = (e as CustomEvent<FlushResult>).detail;
      if (detail.sent > 0 || detail.dropped > 0) setResult(detail);
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener(QUEUE_CHANGED_EVENT, onChanged);
    window.addEventListener(QUEUE_FLUSHED_EVENT, onFlushed);
    if (navigator.onLine) flush();

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener(QUEUE_CHANGED_EVENT, onChanged);
      window.removeEventListener(QUEUE_FLUSHED_EVENT, onFlushed);
    };
  }, [flush]);

  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 6000);
    return () => clearTimeout(t);
  }, [result]);

  if (online && pending === 0 && !result) return null;

  let text: string;
  let tone = 'bg-sidebar-dark text-white';
  if (!online) {
    text =
      pending > 0
        ? `Kamu offline. ${pending} perubahan tersimpan dan dikirim otomatis saat online.`
        : 'Kamu offline. Data yang tampil adalah yang terakhir tersimpan; perubahan akan dikirim saat online.';
  } else if (pending > 0) {
    text = `Mengirim ${pending} perubahan yang tertunda…`;
  } else if (result) {
    tone = 'bg-accent-mint text-accent-mint-text';
    text = `${result.sent} perubahan offline berhasil dikirim.${
      result.dropped > 0 ? ` ${result.dropped} tidak bisa dikirim (mis. check-in hari sebelumnya).` : ''
    }`;
  } else {
    return null;
  }

  return (
    <div
      role="status"
      className={`fixed inset-x-0 top-0 z-[60] px-space-md py-1.5 text-center font-label-sm text-label-sm ${tone}`}
    >
      {text}
    </div>
  );
}
