// Build: 1791691413077
self.addEventListener("install", () => {});
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js");

workbox.core.setCacheNameDetails({ prefix: "xoftwareapp" });
workbox.core.clientsClaim();
workbox.navigationPreload.enable();

workbox.precaching.precacheAndRoute([
  { url: "/offline.html", revision: "1" },
]);

workbox.routing.registerRoute(
  ({ request }) => request.mode === "navigate",
  new workbox.strategies.NetworkFirst({
    cacheName: "pages",
    networkTimeoutSeconds: 4,
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60,
      }),
    ],
  })
);

workbox.routing.setCatchHandler(async ({ event }) => {
  if (event.request.destination === "document") {
    return caches.match("/offline.html");
  }
  return Response.error();
});

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith("/_next/"),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: "next-static",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 120,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ request, url }) =>
    request.destination === "image" || url.pathname.startsWith("/icons/"),
  new workbox.strategies.CacheFirst({
    cacheName: "images",
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ url }) => url.origin === "https://fonts.googleapis.com",
  new workbox.strategies.StaleWhileRevalidate({ cacheName: "google-fonts-styles" })
);
workbox.routing.registerRoute(
  ({ url }) => url.origin === "https://fonts.gstatic.com",
  new workbox.strategies.CacheFirst({
    cacheName: "google-fonts-webfonts",
    plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 })],
  })
);
