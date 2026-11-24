// Service worker Syif PGO: Web Push (nama penghantar dipaparkan pada tajuk)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = {mesej: e.data ? e.data.text() : ''}; }
  const alarm = !!d.alarm || d.jenis === 'alarm';
  const tajuk = (d.tajuk || (alarm ? 'ALARM' : 'Notifikasi')) + (d.dari ? ' dari ' + d.dari : '');
  e.waitUntil(self.registration.showNotification(tajuk + ' - Syif PGO', {
    body: d.mesej || '',
    icon: 'icon-192.png',
    badge: 'icon-192.png',
    tag: alarm ? 'alarm' : undefined,
    renotify: alarm,
    requireInteraction: alarm,
    silent: false,
    timestamp: Date.now(),
    data: {jenis: alarm ? 'alarm' : 'info', mesej: d.mesej || '', dari: d.dari || ''},
    vibrate: alarm ? [500, 200, 500, 200, 500, 200, 500] : [200, 100, 200]
  }));
});

self.addEventListener('notificationclick', e => {
  const dt = e.notification.data || {};
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: 'window', includeUncontrolled: true}).then(l => {
    if (l.length) {
      if (dt.jenis === 'alarm') l[0].postMessage({type: 'alarm', mesej: dt.mesej, dari: dt.dari});
      return l[0].focus();
    }
    return self.clients.openWindow(dt.jenis === 'alarm'
      ? './?alarm=' + encodeURIComponent(dt.mesej || '') + '&dari=' + encodeURIComponent(dt.dari || '') : './');
  }));
});