// UPDATE: Versi dinaikkan ke v3 agar browser memuat ulang data produk & nama gambar baru
const CACHE_NAME = 'neni-cookies-v3'; 

const urlsToCache = [
  './',
  './index.html',
  './assets/img/Logo no bg.png', // Pastikan logo utama ini namanya tidak berubah
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css',
  'https://unpkg.com/aos@2.3.1/dist/aos.css',
  'https://fonts.googleapis.com/css2?family=Pacifico&family=Poppins:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://unpkg.com/aos@2.3.1/dist/aos.js'
];

// 1. Install Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Memaksa SW baru segera aktif tanpa menunggu tab ditutup
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Fetch Resources (STRATEGY HYBRID)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // LOGIKA KHUSUS GAMBAR: Network First
  // Karena nama file gambar baru saja berubah, strategi ini sangat penting.
  // Browser akan mencoba download gambar "Lapis Belacan.png" dari internet dulu.
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i)) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          // Jika berhasil download gambar baru, simpan ke cache
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Jika offline, baru cari di cache
          return caches.match(event.request);
        })
    );
  } 
  
  // LOGIKA FILE LAIN (CSS, JS, Font): Cache First
  // HTML dan JS utama akan diperbarui karena CACHE_NAME berubah
  else {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});

// 3. Update Service Worker & Hapus Cache Lama
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Hapus cache versi lama (misal v2) agar tidak bentrok dengan v3
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Agar SW baru langsung mengambil alih kontrol halaman
  return self.clients.claim();
});
