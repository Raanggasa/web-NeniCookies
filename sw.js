// UPDATE: Versi saya naikkan ke v4
const CACHE_NAME = 'neni-cookies-v5';

const urlsToCache = [
  './',
  './index.html',
  './assets/img/Logo no bg.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css',
  'https://unpkg.com/aos@2.3.1/dist/aos.css',
  'https://fonts.googleapis.com/css2?family=Pacifico&family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://unpkg.com/aos@2.3.1/dist/aos.js'
];

// 1. Install Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Wajib: Paksa SW baru aktif segera
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Fetch Resources (STRATEGY: FRESHNESS FIRST)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // KATEGORI A: HTML (Halaman Utama) & Gambar
  // Strategi: NETWORK FIRST (Cari internet dulu -> baru Cache)
  // Ini kunci agar user selalu dapat versi HTML/Codingan terbaru saat reload
  if (event.request.mode === 'navigate' || 
      url.pathname === './' || 
      url.pathname === '/index.html' || 
      url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i)) {

    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Sukses dapat data baru dari internet? Simpan ke cache buat cadangan
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Gagal konek internet? (Offline) -> Baru ambil dari cache
          return caches.match(event.request);
        })
    );
  }

  // KATEGORI B: Aset Statis (CSS, JS Library, Font)
  // Strategi: CACHE FIRST (Cari cache dulu -> baru Internet)
  // File ini jarang berubah, jadi ambil dari cache biar web tetap ngebut
  else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

// 3. Activate & Bersihkan Cache Lama
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Wajib: Ambil alih kontrol halaman segera
});
