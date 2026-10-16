self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listener untuk pesan internal dari web app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_NOTIF') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: 'https://placehold.co/128x128/EC4899/ffffff?text=🐱',
      badge: 'https://placehold.co/128x128/EC4899/ffffff?text=🐱',
      vibrate: [300, 150, 300, 150, 400],
      tag: 'adelia-schedule-alarm'
    });
  }
});

// Listener untuk notifikasi klik
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
