const CACHE_NAME = "city-care-app-v1";
const STATIC_ASSETS = [
  "/",
  "/scripts/index.js",
  "/styles/styles.css",
  "/images/logo.png",
  "/favicon.png",
];

const API_CACHE_NAME = "city-care-api-v1";

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("Service Worker: Installed");
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("Service Worker: Activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests with network-first strategy
  if (url.origin === "https://story-api.dicoding.dev") {
    event.respondWith(
      caches.open(API_CACHE_NAME).then((cache) => {
        return fetch(request)
          .then((response) => {
            // Cache successful GET requests
            if (request.method === "GET" && response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => {
            // Return cached response if network fails
            return cache.match(request);
          });
      })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push notification received");

  const data = event.data ? event.data.json() : {};
  const title = data.title || "City Care App";
  const options = {
    body: data.options?.body || "New notification",
    icon: "/images/logo.png",
    badge: "/images/logo.png",
    vibrate: [200, 100, 200],
    data: data.data,
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/images/logo.png",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked");

  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/"));
  }
});

// Background sync for offline data
self.addEventListener("sync", (event) => {
  console.log("Service Worker: Background sync triggered");

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log("Service Worker: Performing background sync");
  // This will be handled by the IndexedDB service
}
