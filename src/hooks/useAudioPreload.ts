import { useEffect } from 'react';

interface Section {
  audio_url?: string;
}

/**
 * Preloads the next audio section for seamless playback
 */
export const useAudioPreload = (sections: Section[], currentIndex: number) => {
  useEffect(() => {
    if (currentIndex < 0 || currentIndex >= sections.length - 1) return;
    
    const nextSection = sections[currentIndex + 1];
    if (!nextSection?.audio_url) return;
    
    // Preload next section in background
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = nextSection.audio_url;
    
    return () => {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    };
  }, [currentIndex, sections]);
};
