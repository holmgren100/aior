/**
 * Service Worker for AI Tools Organizer
 * Provides offline support and caching for PWA functionality
 */

const CACHE_NAME = 'ai-tools-v1';
const RUNTIME_CACHE = 'ai-tools-runtime-v1';

// Files to cache on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/app.js',
    '/styles.css',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app shell');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        // For CDN resources (like Fuse.js), use cache first
        if (event.request.url.includes('cdn.jsdelivr.net')) {
            event.respondWith(cacheFirst(event.request));
        }
        return;
    }

    // For API requests (Firebase, OCR, etc), use network only
    if (event.request.url.includes('firebasio.com') ||
        event.request.url.includes('ocr.space') ||
        event.request.url.includes('workers.dev')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For app resources, use network first with cache fallback
    event.respondWith(networkFirst(event.request));
});

/**
 * Network first strategy
 * Try network, fall back to cache if offline
 */
async function networkFirst(request) {
    const cache = await caches.open(RUNTIME_CACHE);

    try {
        const response = await fetch(request);

        // Cache successful responses
        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        // Network failed, try cache
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            console.log('Serving from cache:', request.url);
            return cachedResponse;
        }

        // If not in cache, check precache
        const precachedResponse = await caches.match(request);
        if (precachedResponse) {
            return precachedResponse;
        }

        // Return offline page or error
        return new Response('Offline - resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
                'Content-Type': 'text/plain'
            })
        });
    }
}

/**
 * Cache first strategy
 * Check cache, fall back to network
 */
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const response = await fetch(request);
        const cache = await caches.open(RUNTIME_CACHE);

        if (response && response.status === 200) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        return new Response('Resource not available offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Handle messages from the app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
        );
    }
});

// Background sync (for future enhancement)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-tools') {
        event.waitUntil(syncTools());
    }
});

async function syncTools() {
    // Placeholder for background sync logic
    // Could be used to sync with Firebase when back online
    console.log('Background sync triggered');
}

// Push notifications (for future enhancement)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification('AI Tools Organizer', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('Service Worker loaded');
