export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('[SW] Service Worker registered:', registration.scope);
    
    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      console.log('[SW] New service worker installing...');
      
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] New content available, reload required');
        }
      });
    });
    
    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
};

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;
  
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    return await registration.unregister();
  }
  return false;
};

// Clear audio cache
export const clearAudioCache = async (): Promise<boolean> => {
  if (!navigator.serviceWorker.controller) return false;
  
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data.success || false);
    };
    
    navigator.serviceWorker.controller.postMessage(
      { type: 'CLEAR_CACHE' },
      [messageChannel.port2]
    );
  });
};

// Get cache size
export const getAudioCacheSize = async (): Promise<number> => {
  if (!navigator.serviceWorker.controller) return 0;
  
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data.size || 0);
    };
    
    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_SIZE' },
      [messageChannel.port2]
    );
  });
};
