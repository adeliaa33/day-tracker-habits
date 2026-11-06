/**
 * ============================================================================
 * Service Worker (sw.js) - Adelia's Little World ♡
 * ============================================================================
 * Menyediakan kapabilitas Progressive Web App (PWA) murni frontend:
 * 1. Offline support & App Shell pre-caching
 * 2. Stale-While-Revalidate untuk aset lokal (HTML, JSON, Icon)
 * 3. Cache-First / Stale-While-Revalidate untuk aset CDN eksternal (Tailwind, FontAwesome, Google Fonts)
 * 4. Otomatis membersihkan cache versi lama saat pembaruan dideploy
 */

const CACHE_NAME = 'adelia-planner-v4.1.0';

// Daftar aset inti lokal untuk pre-caching
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Daftar domain eksternal (CDN/Fonts) yang digunakan aplikasi
const EXTERNAL_HOSTS = [
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

/**
 * 1. LIFECYCLE: INSTALL
 * Mengunduh dan menyimpan aset statis lokal ke dalam Cache Storage
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Gunakan Promise.allSettled agar instalasi tetap sukses meskipun ada aset opsional
        return Promise.allSettled(
          STATIC_ASSETS.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Gagal pre-cache ${url}:`, err);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

/**
 * 2. LIFECYCLE: ACTIVATE
 * Membersihkan cache versi lama dan mengambil alih client secara langsung
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Menghapus cache usang:', name);
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

/**
 * 3. LIFECYCLE: FETCH
 * Strategi caching:
 * - Navigasi HTML: Network-First dengan fallback Cache offline
 * - Aset Eksternal (CDN/Font): Stale-While-Revalidate
 * - Aset Lokal (Icon, Manifest, dll): Stale-While-Revalidate
 */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Hanya handle request HTTP / HTTPS dengan metode GET
  if (!req.url.startsWith('http') || req.method !== 'GET') return;

  const url = new URL(req.url);

  // A. Navigasi Dokumen HTML (index.html) -> Network-First dengan Offline Cache Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match('./index.html').then((cachedHtml) => {
            return cachedHtml || caches.match(req);
          });
        })
    );
    return;
  }

  // B. Aset Eksternal & Lokal -> Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Jika offline dan tidak ada di cache, kembalikan null
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
