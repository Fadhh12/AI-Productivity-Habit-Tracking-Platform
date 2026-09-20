import { apiFetch } from './api';

export type PushState =
  | 'unsupported' // browser can't do push at all
  | 'needs-install' // iOS only delivers push to an installed home-screen app
  | 'server-off' // server has no VAPID keys
  | 'denied' // user blocked notifications in the browser
  | 'off'
  | 'on';

interface PublicKeyResponse {
  available: boolean;
  publicKey: string | null;
  devices: number;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

/** VAPID public keys are base64url; the Push API wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

export async function getPushState(): Promise<PushState> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return isIos() && !isStandalone() ? 'needs-install' : 'unsupported';
  }
  const info = await apiFetch<PublicKeyResponse>('/api/push/public-key');
  if (!info.available) return 'server-off';
  if (Notification.permission === 'denied') return 'denied';
  return (await currentSubscription()) ? 'on' : 'off';
}

export async function enablePush(): Promise<PushState> {
  const info = await apiFetch<PublicKeyResponse>('/api/push/public-key');
  if (!info.available || !info.publicKey) return 'server-off';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off';

  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(info.publicKey),
    }));

  await apiFetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify(subscription.toJSON()) });
  return 'on';
}

export async function disablePush(): Promise<PushState> {
  const subscription = await currentSubscription();
  if (subscription) {
    await apiFetch('/api/push/subscribe', { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }) });
    await subscription.unsubscribe();
  }
  return 'off';
}

export async function sendTestPush(): Promise<number> {
  const res = await apiFetch<{ delivered: number }>('/api/push/test', { method: 'POST' });
  return res.delivered;
}
