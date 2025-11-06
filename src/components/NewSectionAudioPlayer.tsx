import React, { useState, useRef, useEffect } from 'react';
import { ChapterList } from '@/components/ChapterList';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudioProgress } from '@/hooks/useAudioProgress';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface Section {
  id: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
  order_index?: number;
}

interface NewSectionAudioPlayerProps {
  guideId: string;
  guideTitle: string;
  sections: Section[];
  mainAudioUrl?: string;
}

export const NewSectionAudioPlayer: React.FC<NewSectionAudioPlayerProps> = ({
  guideId,
  guideTitle,
  sections,
  mainAudioUrl
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1); // -1 means no player shown
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1); // Store volume before muting
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showVolumeHelper, setShowVolumeHelper] = useState(false);
  
  // URL pre-resolution for synchronous playback
  const resolvedUrlsRef = useRef<(string | undefined)[]>([]);
  const resolvedMainRef = useRef<string | undefined>(undefined);
  const [preResolved, setPreResolved] = useState(false);
  
  // iOS/Android audio unlock
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const triedUnlockRef = useRef(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { markChapterCompleted, isChapterCompleted, autoAdvanceEnabled, setAutoAdvance } = useAudioProgress({ guideId });
  
  // Mobile device detection
  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobileDevice = isMobile || isIOS;
  
  // Silent MP3 for iOS unlock (50ms)
  const SILENT_MP3 = 'data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7////////////////////////////////////////////AAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7////////////////////////////////////////////';

  // Determine if we have section-based audio or main audio
  const hasIndividualSections = sections.some(section => section.audio_url);
  const audioMode = hasIndividualSections ? 'sections' : 'main';

  // DEPRECATED: No longer used - URLs are pre-resolved in useEffect
  /*
  const loadAudioSource = async (audioUrl?: string, sectionIndex?: number) => {
    console.log('[NEW-SECTION-PLAYER] Loading audio source:', {
      audioUrl: audioUrl?.substring(0, 50),
      sectionIndex,
      guideId,
      audioMode
    });

    if (!audioUrl) {
      const fallbackUrl = `/tmp/${guideId}.mp3`;
      console.log('[NEW-SECTION-PLAYER] No audio URL provided, using fallback:', fallbackUrl);
      return fallbackUrl;
    }
    
    try {
      // If it's a Supabase storage path (not full URL)
      if (audioUrl && !audioUrl.startsWith('http')) {
        console.log('[NEW-SECTION-PLAYER] Fetching signed URL from Supabase storage');
        const { data: urlData, error } = await supabase.storage
          .from('guide-audio')
          .createSignedUrl(audioUrl, 3600);
        
        if (error) {
          console.error('[NEW-SECTION-PLAYER] Supabase storage error:', error);
          throw error;
        }
        
        if (urlData?.signedUrl) {
          console.log('[NEW-SECTION-PLAYER] Got signed URL:', urlData.signedUrl.substring(0, 50) + '...');
          return urlData.signedUrl;
        }
      }
      
      console.log('[NEW-SECTION-PLAYER] Using provided URL directly');
      return audioUrl;
    } catch (error) {
      console.error('[NEW-SECTION-PLAYER] Error loading audio source:', error);
      // Return original URL as fallback
      return audioUrl;
    }
  };
  */

  const setupAudioElement = (audioElement: HTMLAudioElement) => {
    audioElement.addEventListener('timeupdate', () => {
      setCurrentTime(audioElement.currentTime);
      
      // Check if chapter is 90% complete for progress tracking
      if (currentSectionIndex >= 0 && audioElement.duration > 0) {
        const progress = audioElement.currentTime / audioElement.duration;
        if (progress >= 0.9 && !isChapterCompleted(currentSectionIndex)) {
          markChapterCompleted(currentSectionIndex);
        }
      }
    });
    
    audioElement.addEventListener('loadedmetadata', () => {
      setDuration(audioElement.duration);
    });
    
    audioElement.addEventListener('ended', () => {
      setIsPlaying(false);
      
      // Mark chapter as completed
      if (currentSectionIndex >= 0) {
        markChapterCompleted(currentSectionIndex);
      }
      
      // Auto-advance to next chapter if enabled and available
      if (audioMode === 'sections' && currentSectionIndex < sections.length - 1) {
        if (autoAdvanceEnabled) {
          // Small delay for better UX
          setTimeout(() => {
            playSection(currentSectionIndex + 1);
          }, 500);
        } else {
          // Show next chapter prompt
          const nextChapterTitle = sections[currentSectionIndex + 1]?.title || 'Next Chapter';
          toast({
            title: 'Chapter completed!',
            description: `Ready to play: ${nextChapterTitle}`,
            action: (
              <Button
                size="sm"
                onClick={() => playSection(currentSectionIndex + 1)}
                className="ml-2"
              >
                Play Next
              </Button>
            ),
          });
        }
      } else if (currentSectionIndex >= sections.length - 1) {
        // All chapters completed
        toast({
          title: 'Guide completed!',
          description: 'You have finished listening to all chapters.',
        });
      }
    });
    
    audioElement.addEventListener('error', (e) => {
      const target = e.target as HTMLAudioElement;
      console.error('[NEW-SECTION-PLAYER] Audio element error:', {
        error: e,
        code: target?.error?.code,
        message: target?.error?.message,
        src: target?.src?.substring(0, 50) + '...'
      });
      
      toast({
        title: 'Playback Error',
        description: 'Failed to play audio file. Please check your connection and try again.',
        variant: 'destructive',
      });
      setIsPlaying(false);
      setLoading(false);
    });
  };

  // iOS/Mobile audio unlock with dedicated temporary element
  const ensureAudioUnlocked = () => {
    if (triedUnlockRef.current) {
      console.log('[PLAYER] 🔓 Already tried unlock, skipping');
      return;
    }

    triedUnlockRef.current = true;
    console.log('[PLAYER] 🔓 Attempting mobile unlock with temp element...');

    try {
      // Create temporary audio element separate from main player
      unlockAudioRef.current = new Audio();
      unlockAudioRef.current.setAttribute('playsinline', '');
      unlockAudioRef.current.preload = 'metadata';
      unlockAudioRef.current.volume = 0.01;
      unlockAudioRef.current.src = SILENT_MP3;

      unlockAudioRef.current.play()
        .then(() => {
          console.log('[PLAYER] ✅ unlock SUCCESS');
          setAudioUnlocked(true);
          if (unlockAudioRef.current) {
            unlockAudioRef.current.pause();
            unlockAudioRef.current.currentTime = 0;
            unlockAudioRef.current = null;
          }
        })
        .catch((err) => {
          console.log('[PLAYER] ⚠️ unlock FAILED:', err);
          setAudioUnlocked(false);
          if (unlockAudioRef.current) {
            unlockAudioRef.current = null;
          }
        });
    } catch (err) {
      console.log('[PLAYER] ⚠️ unlock exception:', err);
      setAudioUnlocked(false);
    }
  };

  const playSection = (sectionIndex: number) => {
    if (sectionIndex < 0 || sectionIndex >= sections.length) {
      console.error('[NEW-SECTION-PLAYER] ❌ Invalid section index:', sectionIndex);
      return;
    }
    
    console.log('[NEW-SECTION-PLAYER] ▶️ Play section called:', {
      sectionIndex,
      currentIndex: currentSectionIndex,
      isPlaying,
      audioMode,
      preResolved,
      unlocked: triedUnlockRef.current
    });
    
    // Smart toggle: if same section is playing, pause it
    if (sectionIndex === currentSectionIndex && isPlaying) {
      console.log('[NEW-SECTION-PLAYER] ⏸️ Toggling pause for current section');
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }
    
    setLoading(true);
    setCurrentSectionIndex(sectionIndex);
    
    // Stop current audio if playing
    if (audioRef.current) {
      console.log('[PLAYER] ⏹️ Stopping current audio');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // Mobile unlock guard: only if mobile and not yet tried
    if (isMobileDevice && !triedUnlockRef.current) {
      console.log('[PLAYER] mobile unlock guard triggered');
      ensureAudioUnlocked();
    }
    
    // Get pre-resolved URL
    let audioUrl: string | undefined;
    
    if (audioMode === 'sections') {
      audioUrl = resolvedUrlsRef.current[sectionIndex];
      console.log('[PLAYER] 📦 Using pre-resolved section URL:', audioUrl?.substring(0, 60) + '...');
    } else {
      audioUrl = resolvedMainRef.current;
      console.log('[PLAYER] 📦 Using pre-resolved main URL:', audioUrl?.substring(0, 60) + '...');
    }
    
    // If URL not pre-resolved, do lazy resolve
    if (!audioUrl) {
      console.warn('[PLAYER] ⚠️ URL not pre-resolved, attempting lazy resolve...');
      
      toast({
        title: 'Preparing Audio',
        description: 'Loading audio file, please wait...',
      });
      
      // Lazy resolve (background)
      const lazyResolve = async () => {
        const section = sections[sectionIndex];
        if (!section.audio_url) {
          setLoading(false);
          toast({
            title: 'Error',
            description: 'No audio URL available for this section',
            variant: 'destructive',
          });
          return;
        }
        
        let resolvedUrl = section.audio_url;
        
        // If not HTTP, sign from Supabase
        if (!resolvedUrl.startsWith('http')) {
          try {
            const { data } = await supabase.storage
              .from('guide-audio')
              .createSignedUrl(resolvedUrl, 3600);
            resolvedUrl = data?.signedUrl || resolvedUrl;
            console.log('[PLAYER] ✓ Lazy resolve successful');
          } catch (err) {
            console.error('[PLAYER] ❌ Lazy resolve error:', err);
            // Fallback: try /tmp folder
            resolvedUrl = `/tmp/${guideId}.mp3`;
            console.log('[PLAYER] 🔄 Using fallback URL:', resolvedUrl);
          }
        }
        
        // Cache it
        if (audioMode === 'sections') {
          resolvedUrlsRef.current[sectionIndex] = resolvedUrl;
        } else {
          resolvedMainRef.current = resolvedUrl;
        }
        
        // Retry playSection (URL will be ready now)
        setTimeout(() => playSection(sectionIndex), 0);
      };
      
      lazyResolve();
      return; // Return until lazy resolve completes
    }
    
    // Create or reuse audio element
    if (!audioRef.current) {
      console.log('[PLAYER] 🎵 Creating new Audio element');
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
      audioRef.current.crossOrigin = 'anonymous';
      audioRef.current.setAttribute('playsinline', '');
      setupAudioElement(audioRef.current);
    }
    
    // ⚡ SYNCHRONOUS: Set src immediately and play (NO AWAIT!)
    console.log('[PLAYER] SYNCH PLAY start');
    audioRef.current.src = audioUrl;
    audioRef.current.volume = volume;
    audioRef.current.playbackRate = playbackSpeed;
    
    const playPromise = audioRef.current.play();
    
    if (playPromise) {
      playPromise
        .then(() => {
          console.log('[PLAYER] PLAY started OK');
          setIsPlaying(true);
          setLoading(false);
          
          toast({
            title: 'Now Playing',
            description: sections[sectionIndex]?.title || guideTitle,
          });
        })
        .catch((error) => {
          console.error('[PLAYER] PLAY ERROR:', error);
          setLoading(false);
          
          // NotAllowedError handling
          if (error.name === 'NotAllowedError' || error.message?.includes('NotAllowedError')) {
            console.warn('[PLAYER] 🔒 NotAllowedError detected');
            
            toast({
              title: 'Audio Locked',
              description: 'Please tap again to play',
              variant: 'default',
            });
          } else if (error.name === 'NotSupportedError') {
            toast({
              title: 'Format Error',
              description: 'Audio format not supported on this device',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Playback Error',
              description: 'Failed to start playback. Please try again.',
              variant: 'destructive',
            });
          }
        });
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || currentSectionIndex === -1) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src) {
        playSection(currentSectionIndex);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              console.log('[PLAYER] ▶️ Resumed playback');
            })
            .catch((err) => {
              console.error('[PLAYER] ❌ Resume error:', err);
              toast({
                title: 'Resume Error',
                description: 'Failed to resume playback',
                variant: 'destructive',
              });
            });
        }
      }
    }
  };

  const previousSection = () => {
    if (currentSectionIndex > 0) {
      playSection(currentSectionIndex - 1);
    }
  };

  const nextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      playSection(currentSectionIndex + 1);
    }
  };

  const handleSeek = (newProgress: number[]) => {
    if (audioRef.current) {
      const newTime = (newProgress[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0] / 100;
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      // Restore previous volume when unmuting
      const volumeToRestore = previousVolume > 0 ? previousVolume : 0.5;
      setVolume(volumeToRestore);
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volumeToRestore;
    } else {
      // Store current volume before muting
      setPreviousVolume(volume > 0 ? volume : 0.5);
      setVolume(0);
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setCurrentSectionIndex(-1);
  };

  // Global first interaction listener for mobile unlock
  useEffect(() => {
    if (!isMobileDevice) return;

    const handleFirstInteraction = () => {
      console.log('[PLAYER] global unlock attached (first interaction)');
      ensureAudioUnlocked();
    };

    document.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true, passive: true });
    
    return () => {
      document.removeEventListener('pointerdown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [isMobileDevice]);

  // Pre-resolve all audio URLs on mount
  useEffect(() => {
    const preResolveUrls = async () => {
      console.log('[NEW-SECTION-PLAYER] 🔄 Pre-resolve started for', sections.length, 'sections');
      setPreResolved(false);
      
      // Resolve all section URLs in parallel
      const promises = sections.map(async (section, idx) => {
        if (!section.audio_url) {
          console.log(`[NEW-SECTION-PLAYER] ⚠️ Section ${idx} has no audio_url`);
          return undefined;
        }
        
        // Use direct URL if it starts with http
        if (section.audio_url.startsWith('http')) {
          console.log(`[NEW-SECTION-PLAYER] ✓ Section ${idx} using direct URL`);
          return section.audio_url;
        }
        
        // Get signed URL from Supabase storage
        try {
          const { data, error } = await supabase.storage
            .from('guide-audio')
            .createSignedUrl(section.audio_url, 3600);
          
          if (error) {
            console.error(`[NEW-SECTION-PLAYER] ❌ Pre-resolve error section ${idx}:`, error);
            return undefined;
          }
          
          console.log(`[NEW-SECTION-PLAYER] ✓ Section ${idx} signed successfully`);
          return data?.signedUrl;
        } catch (err) {
          console.error(`[NEW-SECTION-PLAYER] ❌ Pre-resolve exception section ${idx}:`, err);
          return undefined;
        }
      });
      
      const resolved = await Promise.all(promises);
      resolvedUrlsRef.current = resolved;
      
      // Resolve main audio URL if exists
      if (mainAudioUrl) {
        if (mainAudioUrl.startsWith('http')) {
          resolvedMainRef.current = mainAudioUrl;
          console.log('[NEW-SECTION-PLAYER] ✓ Main audio using direct URL');
        } else {
          try {
            const { data } = await supabase.storage
              .from('guide-audio')
              .createSignedUrl(mainAudioUrl, 3600);
            resolvedMainRef.current = data?.signedUrl;
            console.log('[NEW-SECTION-PLAYER] ✓ Main audio signed successfully');
          } catch (err) {
            console.error('[NEW-SECTION-PLAYER] ❌ Main audio pre-resolve error:', err);
          }
        }
      }
      
      setPreResolved(true);
      const readyCount = resolved.filter(Boolean).length;
      console.log(`[NEW-SECTION-PLAYER] ✅ Pre-resolve completed: ${readyCount}/${sections.length} URLs ready`);
    };
    
    if (sections.length > 0 || mainAudioUrl) {
      preResolveUrls();
    }
  }, [sections, mainAudioUrl, guideId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  if (!sections.length) {
    return (
      <div className="text-center p-6 text-muted-foreground">
        No audio content available for this guide.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chapter List with Inline Audio Controls */}
      <ChapterList
        sections={sections}
        currentSectionIndex={currentSectionIndex}
        isPlaying={isPlaying}
        loading={loading}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        playbackSpeed={playbackSpeed}
        canGoNext={currentSectionIndex < sections.length - 1}
        canGoPrevious={currentSectionIndex > 0}
        autoAdvanceEnabled={autoAdvanceEnabled}
        isChapterCompleted={isChapterCompleted}
        onPlaySection={playSection}
        onTogglePlayPause={togglePlayPause}
        onSeek={handleSeek}
        onSkip={skip}
        onPreviousSection={previousSection}
        onNextSection={nextSection}
        onToggleMute={toggleMute}
        onVolumeChange={handleVolumeChange}
        onSpeedChange={handleSpeedChange}
        onAutoAdvanceChange={setAutoAdvance}
      />
    </div>
  );
};