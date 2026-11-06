const CACHE_NAME = 'adelia-planner-v4';

// Aset lokal yang dicoba di-cache secara aman
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Install Event - Gunakan penanganan aman agar jika ada file hilang, SW TIDAK CRASH
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const asset of LOCAL_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('Gagal meng-cache aset (diabaikan agar HP tidak blank):', asset);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Hapus cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Mengambil dari Jaringan / Cache dengan aman
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Jika berhasil mengambil versi terbaru dari jaringan, simpan ke cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Jika HP sedang offline/koneksi terputus, ambil dari cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('./');
          }
        });
      })
  );
});

// Listener untuk menerima perintah Notifikasi dari Aplikasi Utama
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULED_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [200, 100, 200, 100, 300],
      tag: 'adelia-schedule-alarm',
      renotify: true
    });
  }
});
