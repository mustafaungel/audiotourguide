import { useEffect } from 'react';

/**
 * Preloads the next audio URL into the browser HTTP cache for seamless playback.
 * Pass an array of resolved URLs and the current index — the hook will preload
 * the next URL in the background using a hidden Audio element with preload='auto'.
 */
export const useAudioPreload = (urls: (string | undefined)[], currentIndex: number) => {
  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= urls.length - 1) return;

    const nextUrl = urls[currentIndex + 1];
    if (!nextUrl) return;

    // Preload next section in background (browser HTTP cache)
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = nextUrl;

    return () => {
      try {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      } catch {
        // ignore
      }
    };
  }, [currentIndex, urls]);
};
