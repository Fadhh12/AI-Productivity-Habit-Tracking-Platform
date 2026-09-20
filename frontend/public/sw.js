/* Continuum service worker: offline app shell + last-known data. */
const VERSION = 'v2';
const SHELL_CACHE = `continuum-shell-${VERSION}`;
const STATIC_CACHE = `continuum-static-${VERSION}`;
// RSC payloads share URLs with the HTML pages, so they live in their own cache to avoid overwriting each other.
const RSC_CACHE = `continuum-rsc-${VERSION}`;
// Keep in sync with API_CACHE_NAME in lib/offlineQueue.ts (the app deletes it on login/logout).
const API_CACHE = 'continuum-api-v1';
const KEEP = [SHELL_CACHE, STATIC_CACHE, RSC_CACHE, API_CACHE];

const PRECACHE = ['/offline.html', '/manifest.json', '/icons/icon.svg'];
const API_TIMEOUT_MS = 6000;
// API paths that must never be replayed from cache.
const API_SKIP = ['/api/auth/', '/api/ai/', '/api/calendar/google/auth-url', '/api/calendar/google/callback', '/monthly/export'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => !KEEP.includes(key)).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// Network first, so data is never silently stale while online; the cached copy is only used when the network fails.
async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await withTimeout(fetch(request), API_TIMEOUT_MS);
    if (response.ok) cache.put(request.url, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request.url);
    return cached ?? Response.error();
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const response = await fetch(request);
    // Redirected responses can't be served back to a navigation, so don't cache them.
    if (response.ok && !response.redirected) cache.put(request, response.clone());
    return response;
  } catch {
    return (
      (await cache.match(request, { ignoreSearch: true, ignoreVary: true })) ??
      (await cache.match('/offline.html')) ??
      Response.error()
    );
  }
}

// Next.js fetches an RSC payload on client-side route changes; cache those too so switching screens works offline.
async function networkFirstRsc(request) {
  const cache = await caches.open(RSC_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request, { ignoreVary: true })) ?? Response.error();
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached ?? (await refresh) ?? Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    if (API_SKIP.some((part) => url.pathname.includes(part))) return;
    event.respondWith(networkFirstApi(request));
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') {
    event.respondWith(networkFirstRsc(request));
    return;
  }

  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  }
});

// ---- Web Push ----

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }

  event.waitUntil(
    (async () => {
      // The in-app bell already covers someone who is looking at the app right now.
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (data.tag !== 'test_push' && windows.some((client) => client.visibilityState === 'visible')) return;

      await self.registration.showNotification(data.title || 'Continuum', {
        body: data.body || '',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: data.tag || 'continuum',
        data: { url: data.url || '/today' },
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/today';

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (new URL(client.url).origin === self.location.origin) {
          await client.focus();
          if ('navigate' in client) await client.navigate(target);
          return;
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
