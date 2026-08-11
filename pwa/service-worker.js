// Service Worker for PWA shell (enables install + offline bootstrap screen)
// Version bump forces re-cache: change CACHE_NAME whenever shell files are updated
const CACHE_NAME = "kc-pwa-v1";
const SHELL_FILES = [
  "./",
  "index.html",
  "manifest.webmanifest"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_FILES).catch(function () { /* ignore offline errors */ });
    })
  );
  // Force the waiting service worker to become active immediately
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  // Take control of all clients immediately
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle same-origin shell requests; the iframe loads the target app directly
  if (url.origin !== self.location.origin) return;

  // Navigation: always try network first, fall back to cached shell
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(function () {
        return caches.match("index.html");
      })
    );
    return;
  }

  // Static assets: network-first (always try fresh, cache as fallback + update cache)
  event.respondWith(
    fetch(req).then(function (resp) {
      // Update cache with fresh response for next offline use
      if (resp.status === 200) {
        var copy = resp.clone();
        caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
      }
      return resp;
    }).catch(function () {
      return caches.match(req);
    })
  );
});
