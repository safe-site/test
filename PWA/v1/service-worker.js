// Add this part to register the beforeinstallprompt event
let deferredPrompt;

self.addEventListener('beforeinstallprompt', (event) => {
  // Prevent Chrome 76 and later from automatically showing the prompt
  event.preventDefault();
  
  // Stash the event so it can be triggered later
  deferredPrompt = event;
  
  // Optionally, notify the user that your app is installable
  // You can display a custom UI element to prompt the user to install the app
});

// The rest of your service worker code...
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('PWA-cache').then((cache) => {
      return cache.addAll([
        '',
        'index.html',
        'assets/app-icon.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
