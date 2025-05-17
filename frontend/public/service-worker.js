// QuoteSync Service Worker for Caching

// Cache names
const STATIC_CACHE_NAME = 'quotesync-static-v1';
const DYNAMIC_CACHE_NAME = 'quotesync-dynamic-v1';
const COVERS_CACHE_NAME = 'quotesync-covers-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/images/book-placeholder.png',
  '/assets/images/avatar-placeholder.png',
  // Add other core assets as needed
];

// OpenLibrary and cover domains to specifically cache
const COVER_DOMAINS = [
  'covers.openlibrary.org',
  'openlibrary.org',
  'covers.librarything.com'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting(); // Activate immediately
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(keyList => {
        return Promise.all(keyList.map(key => {
          // Remove any old caches not in our current list
          if (
            key !== STATIC_CACHE_NAME && 
            key !== DYNAMIC_CACHE_NAME && 
            key !== COVERS_CACHE_NAME
          ) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        }));
      })
  );
  
  return self.clients.claim();
});

// Helper to check if a URL is for a book cover
const isBookCover = url => {
  try {
    const urlObj = new URL(url);
    // Check only for valid http/https URLs
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      return false;
    }
    return COVER_DOMAINS.some(domain => urlObj.hostname === domain);
  } catch (e) {
    console.error('[Service Worker] Error parsing URL:', url, e);
    return false;
  }
};

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
  // Skip non-HTTP/HTTPS requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  const request = event.request;
  let url;
  
  try {
    url = new URL(request.url);
  } catch (error) {
    console.error('[Service Worker] Invalid URL:', request.url);
    return; // Skip invalid URLs
  }
  
  // Handle book cover requests specially
  if (isBookCover(request.url)) {
    event.respondWith(
      caches.open(COVERS_CACHE_NAME)
        .then(cache => {
          return cache.match(request)
            .then(response => {
              if (response) {
                // Return from cache if available
                console.log('[Service Worker] Serving cover from cache:', request.url);
                return response;
              }
              
              // Fetch from network and cache
              return fetch(request)
                .then(networkResponse => {
                  if (networkResponse.ok) {
                    // Make a copy of the response to store in cache
                    const clonedResponse = networkResponse.clone();
                    
                    // Safely store in cache
                    try {
                      cache.put(request, clonedResponse);
                      console.log('[Service Worker] Caching new cover:', request.url);
                    } catch (cacheError) {
                      console.error('[Service Worker] Cache put error:', cacheError);
                      // Continue anyway, returning the network response
                    }
                  }
                  return networkResponse;
                })
                .catch(err => {
                  console.error('[Service Worker] Fetch failed for cover:', err);
                  // Could return a placeholder image here
                  return new Response('Cover image not available', {
                    status: 404,
                    headers: { 'Content-Type': 'text/plain' }
                  });
                });
            });
        })
    );
    return;
  }
  
  // Handle API requests - network-first strategy for freshness
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache API responses for offline use
          if (response.ok && request.method === 'GET') {
            try {
              const clonedResponse = response.clone();
              caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => {
                  try {
                    cache.put(request, clonedResponse);
                  } catch (error) {
                    console.error('[Service Worker] Error caching API response:', error);
                  }
                });
            } catch (error) {
              console.error('[Service Worker] Error cloning response:', error);
            }
          }
          return response;
        })
        .catch(error => {
          console.error('[Service Worker] API fetch error:', error);
          // If network fails, try from cache
          return caches.match(request)
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If not in cache, return a proper error response
              return new Response(JSON.stringify({ error: 'Network request failed' }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }
  
  // Default strategy: Cache falling back to network
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // Clone the request because it's a one-time use stream
        const fetchRequest = request.clone();
        
        return fetch(fetchRequest)
          .then(newResponse => {
            // Check valid response
            if (!newResponse || newResponse.status !== 200 || newResponse.type !== 'basic') {
              return newResponse;
            }
            
            try {
              // Clone response to store in cache
              const responseToCache = newResponse.clone();
              
              caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => {
                  try {
                    // Only cache requests with proper URLs
                    if (request.url.startsWith('http')) {
                      cache.put(request, responseToCache)
                        .catch(error => console.error('[Service Worker] Cache put error:', error));
                    }
                  } catch (error) {
                    console.error('[Service Worker] Error in cache put:', error);
                  }
                })
                .catch(error => console.error('[Service Worker] Error opening cache:', error));
            } catch (error) {
              console.error('[Service Worker] Error cloning response:', error);
            }
            
            return newResponse;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch error:', error);
            return new Response('Network error occurred', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync event for offline actions
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background Sync:', event.tag);
  
  if (event.tag === 'sync-quotes') {
    event.waitUntil(
      // Process pending offline actions from IndexedDB
      // Implementation depends on your IndexedDB structure
      console.log('[Service Worker] Syncing pending quotes')
    );
  }
}); 