// Service worker Syif PGO: Web Push (padan dengan sw.js lama dan Edge Function hantar-push)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = {mesej: e.data ? e.data.text() : ''}; }
  const alarm = !!d.alarm || d.jenis === 'alarm';
  const tajuk = d.tajuk || (alarm ? 'ALARM' : 'Notifikasi');
  e.waitUntil(self.registration.showNotification(tajuk + ' - Syif PGO', {
    body: (d.mesej || '') + (d.dari ? ' (' + d.dari + ')' : ''),
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: alarm ? 'alarm' : undefined,
    renotify: alarm,
    requireInteraction: alarm,
    vibrate: alarm ? [500, 200, 500, 200, 500, 200, 500] : [200, 100, 200]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true})
    .then(l => (l.length ? l[0].focus() : self.clients.openWindow('./'))));
});