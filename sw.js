// Service worker Syif PGO: Web Push (nama penghantar dipaparkan pada tajuk)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

async function kemaskiniBadge(d) {
  const nav = self.navigator;
  if (!nav) return;
  const isChat = d.jenis === 'chat' || d.tab === 't6';
  const kira = Number(d.badgeCount);
  try {
    if (Number.isFinite(kira) && kira > 0 && 'setAppBadge' in nav) {
      await nav.setAppBadge(kira);
    } else if (isChat && 'setAppBadge' in nav) {
      await nav.setAppBadge();
    }
  } catch (_) {}
}

async function kosongkanBadge() {
  const nav = self.navigator;
  if (nav && 'clearAppBadge' in nav) {
    try { await nav.clearAppBadge(); } catch (_) {}
  }
}

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data.json(); } catch (_) { d = {mesej: e.data ? e.data.text() : ''}; }
  const alarm = !!d.alarm || d.jenis === 'alarm';
  const isChat = d.jenis === 'chat' || d.tab === 't6';
  const tajuk = (d.tajuk || (alarm ? 'ALARM' : isChat ? 'Chat' : 'Notifikasi')) + (d.dari ? ' dari ' + d.dari : '');
  const url = d.url || (isChat ? './?tab=t6' : './');

  e.waitUntil((async () => {
    await kemaskiniBadge(d);
    await self.registration.showNotification(tajuk + ' - Syif PGO', {
      body: d.mesej || '',
      icon: 'icon-192.png',
      badge: 'icon-192.png',
      tag: alarm ? 'alarm' : (isChat ? 'chat' : undefined),
      renotify: alarm || isChat,
      requireInteraction: alarm,
      silent: false,
      timestamp: Date.now(),
      data: {
        jenis: alarm ? 'alarm' : (isChat ? 'chat' : 'info'),
        mesej: d.mesej || '',
        dari: d.dari || '',
        url
      },
      vibrate: alarm ? [500, 200, 500, 200, 500, 200, 500] : [200, 100, 200]
    });
  })());
});

self.addEventListener('notificationclick', e => {
  const dt = e.notification.data || {};
  e.notification.close();
  e.waitUntil((async () => {
    if (dt.jenis === 'chat' || (dt.url && dt.url.includes('tab=t6'))) {
      await kosongkanBadge();
    }
    const l = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    const targetUrl = dt.jenis === 'alarm'
      ? './?alarm=' + encodeURIComponent(dt.mesej || '') + '&dari=' + encodeURIComponent(dt.dari || '')
      : (dt.url || './');
    if (l.length) {
      if (dt.jenis === 'alarm') l[0].postMessage({type: 'alarm', mesej: dt.mesej, dari: dt.dari});
      if (dt.jenis === 'chat' || (dt.url && dt.url.includes('tab=t6'))) l[0].postMessage({type: 'open-chat'});
      return l[0].focus();
    }
    return self.clients.openWindow(targetUrl);
  })());
});