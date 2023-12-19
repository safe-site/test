// Service Worker Installation
self.addEventListener("install", (e) => {
    e.waitUntil(
      caches.open("PWA-static").then((cache) => {
        return cache.addAll([
          "./",
          "./src/index.css",
          "/images/logo192.png"
        ]);
      })
    );
  });
  
  // Service Worker Fetch
  self.addEventListener("fetch", (e) => {
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch(e.request);
      })
    );
  });
  