/**
 * public/sw.js
 *
 * PWA service worker (Issue #136). Registered only in production builds —
 * see components/pwa/ServiceWorkerRegistration.tsx, which skips registration
 * entirely when NEXT_PUBLIC_USE_MOCKS=true so this never runs alongside
 * MSW's mockServiceWorker.js in dev/mock mode.
 *
 * Scope is narrowed to this file's own registration (see the `scope` option
 * passed to navigator.serviceWorker.register), separate from MSW's root-scope
 * worker, so the two never fight over which one controls a page.
 */

const CACHE_NAME = "facilpay-shell-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(() =>
      caches.open(CACHE_NAME).then((cache) => cache.match(OFFLINE_URL))
    )
  );
});
