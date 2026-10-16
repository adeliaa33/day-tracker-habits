// sw.js
const CACHE_NAME = 'adelia-planner-v1';

// 1. Tangkap Sinyal Push dari Background / HP Ditutup
self.addEventListener('push', (event) => {
  let data = { title: "Adelia's Little World ♡", body: "Ada pengingat jadwal baru untukmu! 🐾" };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/badge.png',
    vibrate: [200, 100, 200, 100, 300], // Getar HP
    tag: 'adelia-schedule-notification',
    renotify: true,
    data: {
      url: self.registration.scope
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 2. Saat Notifikasi Diklik -> Buka Web Aplikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
