// Service Worker for PWA shell (enables install + offline bootstrap screen)
// Version bump forces re-cache: change CACHE_NAME whenever shell files are updated
const CACHE_NAME = "kc-pwa-v2";
const SHELL_FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icon-192.png",
  "icon-512.png"
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

// Business data API paths that must always be fresh (never served from cache)
const API_PREFIXES = ["/api/"];

function isApiRequest(url) {
  return API_PREFIXES.some(function (p) { return url.pathname.indexOf(p) === 0; });
}

self.addEventListener("fetch", function (event) {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Only handle same-origin shell requests; the iframe loads the target app directly
  if (url.origin !== self.location.origin) return;

  // Business data: always go to network, no caching (keeps data live)
  if (isApiRequest(url)) {
    event.respondWith(fetch(req));
    return;
  }

  // Navigation + static shell assets: cache-first for instant load,
  // fall back to network (and refresh cache) only if not in cache
  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (resp) {
        if (resp.status === 200) {
          var copy = resp.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
        }
        return resp;
      }).catch(function () {
        // Offline last-resort: serve the shell for navigations
        if (req.mode === "navigate") return caches.match("index.html");
        return new Response("", { status: 504, statusText: "offline" });
      });
    })
  );
});
