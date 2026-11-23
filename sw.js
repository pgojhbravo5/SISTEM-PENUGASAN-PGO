// Service worker untuk Web Push
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('push', (e) => {
  let d = { tajuk: 'Notifikasi', mesej: '', alarm: false };
  try {
    d = Object.assign(d, e.data.json());
  } catch (_) {}
  e.waitUntil(
    self.registration.showNotification(d.tajuk + ' - Syif PGO', {
      body: d.mesej,
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: d.alarm ? 'alarm' : undefined,
      renotify: !!d.alarm,
      requireInteraction: !!d.alarm,
      vibrate: d.alarm ? [500, 200, 500, 200, 500, 200, 500] : [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((l) => (l.length ? l[0].focus() : clients.openWindow('./')))
  );
});
