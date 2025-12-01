/**
 * Service Worker for handling push events.
 * This file MUST be in your public/static assets directory.
 */
self.addEventListener('push', (event) => {
    // The notification payload is passed in event.data
    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = { title: "Push Notification", body: "You have a new update." };
    }

    const title = data.title;
    const options = {
        body: data.body,
        icon: data.icon || 'https://placehold.co/192x192/007bff/white?text=CF', // Example icon
        badge: data.badge,
        data: data.data
    };

    // Keep the service worker alive until the notification is shown
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    // Optional: Add logic for when the user clicks the notification
    event.notification.close();
    // Example: event.waitUntil(clients.openWindow('/'));
});
