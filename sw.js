// Service worker — ทำให้เกมเล่น offline ได้และติดตั้งเป็นแอปได้ (PWA)
// กลยุทธ์: precache app shell แล้วใช้ stale-while-revalidate กับไฟล์ same-origin
// (เสิร์ฟจาก cache ทันที + อัปเดตเบื้องหลัง → ผู้เล่นได้เวอร์ชันใหม่ในการเปิดครั้งถัดไป)
// cross-origin (Google Fonts, Supabase) ไม่ intercept — โดยเฉพาะ Supabase ห้าม cache เด็ดขาด
var CACHE = 'quizdash-v2';
var PRECACHE = [
  './',
  './index.html',
  './config.js',
  './data/questions.general.js',
  './data/questions.sports.js',
  './data/questions.entertainment.js',
  './data/questions.science.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(PRECACHE); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // Supabase/fonts ผ่านตรง

  e.respondWith(
    caches.open(CACHE).then(function (c) {
      return c.match(e.request, { ignoreSearch: e.request.mode === 'navigate' }).then(function (cached) {
        var fetched = fetch(e.request).then(function (res) {
          if (res && res.ok) c.put(e.request, res.clone());
          return res;
        }).catch(function () {
          // offline: ถ้าเป็นการเปิดหน้า ให้ fallback ไป index.html ที่ precache ไว้
          if (e.request.mode === 'navigate') return c.match('./index.html');
          return cached;
        });
        return cached || fetched;
      });
    })
  );
});
