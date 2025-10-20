/* Service Worker — mise en cache offline de base */
const CACHE_NAME = "lgc-pev-v1";
const FONTS_STYLES_CACHE = "lgc-fonts-styles-v1";
const FONTS_FILES_CACHE = "lgc-fonts-files-v1";
const ASSETS = [
  "index.html",
  "css/main.css",
  "js/app.js",
  "asset/lgc-antenne.png",
  "favicon/favicon-16x16.png",
  "favicon/favicon-32x32.png",
  "favicon/favicon.ico",
  "favicon/apple-touch-icon.png",
  "favicon/android-chrome-192x192.png",
  "favicon/android-chrome-512x512.png",
  "favicon/site.webmanifest",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const urls = ASSETS.map((p) => new URL(p, self.location).toString());
      await cache.addAll(urls);
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      const allowed = new Set([CACHE_NAME, FONTS_STYLES_CACHE, FONTS_FILES_CACHE]);
      await Promise.all(names.filter((n) => !allowed.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Google Fonts: sépare les CSS (stale-while-revalidate) et les fichiers de police (cache-first)
  if (url.hostname === "fonts.googleapis.com") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FONTS_STYLES_CACHE);
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((res) => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => undefined);
        return cached || (await networkPromise) || Response.error();
      })()
    );
    return;
  }

  if (url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FONTS_FILES_CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res && res.ok) cache.put(request, res.clone());
          return res;
        } catch (err) {
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Navigation: réseau d'abord, repli sur index.html en offline
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          return fresh;
        } catch (err) {
          const cached = await caches.match(new URL("index.html", self.location).toString());
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Même origine: cache d'abord, repli réseau puis mise en cache
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const res = await fetch(request);
          if (res && res.ok) {
            cache.put(request, res.clone());
          }
          return res;
        } catch (err) {
          return cached || Response.error();
        }
      })()
    );
  }
});
