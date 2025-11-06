const CACHE_NAME = 'audio-guides-v1';
const AUDIO_CACHE = 'audio-guides-audio-v1';

// Audio file patterns to cache
const AUDIO_PATTERNS = [
  /\/guide-audio\//,           // Supabase storage
  /\.mp3$/,                     // MP3 files
  /\/tmp\/.*\.mp3$/,           // Fallback audio
];

// Install event - setup caches
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('audio-guides-') && name !== CACHE_NAME && name !== AUDIO_CACHE)
          .map(name => caches.delete(name))
      );
    })
  );
  return self.clients.claim(); // Take control immediately
});

// Fetch event - intercept requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Check if this is an audio file request
  const isAudioFile = AUDIO_PATTERNS.some(pattern => pattern.test(url.pathname));

  if (isAudioFile) {
    event.respondWith(handleAudioRequest(request));
  } else {
    // For non-audio files, use network first
    event.respondWith(fetch(request).catch(() => {
      return new Response('Network error', { status: 503 });
    }));
  }
});

// Audio request handler - Network First with Cache Fallback
async function handleAudioRequest(request) {
  const cache = await caches.open(AUDIO_CACHE);
  
  try {
    // Try network first
    console.log('[SW] Fetching audio from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      // Clone response before caching (can only read once)
      const responseToCache = networkResponse.clone();
      
      // Cache the audio file
      console.log('[SW] Caching audio:', request.url);
      await cache.put(request, responseToCache);
      
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
  }
  
  // Network failed, try cache
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }
  
  // Both failed
  console.error('[SW] Audio not available:', request.url);
  return new Response('Audio not available', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(AUDIO_CACHE).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
  
  if (event.data.type === 'GET_CACHE_SIZE') {
    event.waitUntil(
      getCacheSize().then(size => {
        event.ports[0].postMessage({ size });
      })
    );
  }
});

// Helper: Calculate cache size
async function getCacheSize() {
  const cache = await caches.open(AUDIO_CACHE);
  const keys = await cache.keys();
  let totalSize = 0;
  
  for (const request of keys) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }
  
  return totalSize;
}
