import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache the underlying font files with a cache-first strategy for 1 year
registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// Cache images with a cache-first strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache API responses with network-first strategy
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// Background sync for offline form submissions
const bgSyncPlugin = new BackgroundSyncPlugin('labflow-queue', {
  maxRetentionTime: 24 * 60, // Retry for max of 24 Hours
});

registerRoute(
  /\/api\/(patients|tests|results|samples)/,
  new NetworkFirst({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  /\/api\/(patients|tests|results|samples)/,
  new NetworkFirst({
    plugins: [bgSyncPlugin],
  }),
  'PUT'
);

// Skip waiting and claim clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Listen for sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-results') {
    event.waitUntil(syncResults());
  }
});

// Sync results when online
async function syncResults() {
  try {
    // Get all pending results from IndexedDB
    const cache = await caches.open('offline-results');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          // Remove from cache if successfully synced
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Failed to sync result:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/labflow-icon-192.png',
    badge: '/labflow-badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id,
    },
    actions: [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'LabFlow Notification', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow('/notifications')
    );
  }
});

// Periodic background sync for critical updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-critical-results') {
    event.waitUntil(checkCriticalResults());
  }
});

async function checkCriticalResults() {
  try {
    const response = await fetch('/api/results/critical');
    if (response.ok) {
      const results = await response.json();
      if (results.length > 0) {
        // Show notification for critical results
        await self.registration.showNotification('Critical Results', {
          body: `${results.length} critical results require immediate attention`,
          icon: '/labflow-icon-192.png',
          badge: '/labflow-badge-72.png',
          tag: 'critical-results',
          requireInteraction: true,
        });
      }
    }
  } catch (error) {
    console.error('Failed to check critical results:', error);
  }
}