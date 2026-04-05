import React, { useState, useRef, useEffect } from 'react';
import { ChapterList } from '@/components/ChapterList';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudioProgress } from '@/hooks/useAudioProgress';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/translations';

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
  lang?: string;
}

export const NewSectionAudioPlayer: React.FC<NewSectionAudioPlayerProps> = ({
  guideId,
  guideTitle,
  sections,
  mainAudioUrl,
  lang = 'en'
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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { markChapterCompleted, isChapterCompleted, autoAdvanceEnabled, setAutoAdvance } = useAudioProgress({ guideId });

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
          const nextChapterTitle = sections[currentSectionIndex + 1]?.title || t('playNext', lang);
          toast({
            title: t('chapterCompleted', lang),
            description: `${t('readyToPlay', lang)}: ${nextChapterTitle}`,
            action: (
              <Button
                size="sm"
                onClick={() => playSection(currentSectionIndex + 1)}
                className="ml-2"
              >
                {t('playNext', lang)}
              </Button>
            ),
          });
        }
      } else if (currentSectionIndex >= sections.length - 1) {
        // All chapters completed
        toast({
          title: t('guideCompleted', lang),
          description: t('allChaptersFinished', lang),
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
        title: t('playbackError', lang),
        description: t('playbackErrorDesc', lang),
        variant: 'destructive',
      });
      setIsPlaying(false);
      setLoading(false);
    });
  };

  // Helper to resolve audio URL synchronously (getPublicUrl)
  const resolveAudioUrl = (audioPath?: string): string => {
    if (!audioPath) {
      console.warn('[PLAYER] No audio path, using fallback');
      return `/tmp/${guideId}.mp3`;
    }
    
    // ✅ If full URL (http/https), use directly
    if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) {
      console.log('[PLAYER] Using direct URL:', audioPath.substring(0, 60) + '...');
      return audioPath;
    }
    
    // ✅ If storage path without domain, add it
    if (audioPath.startsWith('/storage/v1/object/public')) {
      const fullUrl = `https://dsaqlgxajdnwoqvtsrqd.supabase.co${audioPath}`;
      console.log('[PLAYER] Converted storage path to URL:', fullUrl.substring(0, 60) + '...');
      return fullUrl;
    }
    
    // Use getPublicUrl for synchronous resolution
    const { data } = supabase.storage
      .from('guide-audio')
      .getPublicUrl(audioPath);
    
    const publicUrl = data?.publicUrl || `/tmp/${guideId}.mp3`;
    console.log('[PLAYER] Generated public URL:', publicUrl.substring(0, 60) + '...');
    return publicUrl;
  };

  const playSection = (sectionIndex: number) => {
    if (sectionIndex < 0 || sectionIndex >= sections.length) {
      console.error('[PLAYER] ❌ Invalid section index:', sectionIndex);
      return;
    }
    
    console.log('[PLAYER] ▶️ Play section called:', {
      sectionIndex,
      currentIndex: currentSectionIndex,
      isPlaying,
      audioMode
    });
    
    // Smart toggle: if same section is playing, pause it
    if (sectionIndex === currentSectionIndex && isPlaying) {
      console.log('[PLAYER] ⏸️ Toggling pause for current section');
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
    
    // Get URL (pre-resolved or lazy resolve) - NOW SYNCHRONOUS
    let audioUrl = resolvedUrlsRef.current[sectionIndex];
    if (!audioUrl) {
      console.log('[PLAYER] 🔄 Lazy resolving URL synchronously...');
      const section = sections[sectionIndex];
      audioUrl = resolveAudioUrl(section.audio_url); // No await!
      resolvedUrlsRef.current[sectionIndex] = audioUrl;
    }
    
    console.log('[PLAYER] 📦 Using URL:', audioUrl?.substring(0, 60) + '...');
    
    // Create or reuse audio element
    if (!audioRef.current) {
      console.log('[PLAYER] 🎵 Creating new Audio element');
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
      audioRef.current.setAttribute('playsinline', '');
      audioRef.current.crossOrigin = 'anonymous'; // ✅ CORS support
      setupAudioElement(audioRef.current);
    }
    
    // Set source and play IMMEDIATELY (within user gesture)
    audioRef.current.src = audioUrl;
    audioRef.current.volume = volume;
    audioRef.current.playbackRate = playbackSpeed;
    
    // Play immediately without waiting for canplay
    const playPromise = audioRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[PLAYER] ✅ PLAY started successfully');
          setIsPlaying(true);
          setLoading(false);
          
          toast({
            title: t('nowPlaying', lang),
            description: sections[sectionIndex]?.title || guideTitle,
          });
        })
        .catch((error: any) => {
          console.error('[PLAYER] ❌ PLAY ERROR:', error);
          setLoading(false);
          setIsPlaying(false);
          
          if (error.name === 'NotAllowedError') {
            toast({
              title: t('audioLocked', lang),
              description: t('tapToPlay', lang),
              variant: 'default',
            });
          } else if (error.name === 'NotSupportedError') {
            toast({
              title: t('formatError', lang),
              description: t('formatNotSupported', lang),
              variant: 'destructive',
            });
          } else {
            toast({
              title: t('playbackError', lang),
              description: t('playbackErrorDesc', lang),
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
                title: t('resumeError', lang),
                description: t('resumeErrorDesc', lang),
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


  // Pre-resolve all audio URLs on mount - SYNCHRONOUSLY
  useEffect(() => {
    console.log('[NEW-SECTION-PLAYER] 🔄 Pre-resolve started for', sections.length, 'sections');
    
    // ✅ Resolve all section URLs using resolveAudioUrl helper
    const resolved = sections.map((section, idx) => {
      if (!section.audio_url) {
        console.log(`[NEW-SECTION-PLAYER] ⚠️ Section ${idx} has no audio_url, using fallback`);
        return mainAudioUrl ? resolveAudioUrl(mainAudioUrl) : `/tmp/${guideId}.mp3`;
      }
      
      // ✅ Use section's audio_url directly through helper
      const url = resolveAudioUrl(section.audio_url);
      console.log(`[NEW-SECTION-PLAYER] ✓ Section ${idx} resolved:`, url.substring(0, 60) + '...');
      return url;
    });
    
    resolvedUrlsRef.current = resolved;
    
    // Resolve main audio URL if exists
    if (mainAudioUrl) {
      resolvedMainRef.current = resolveAudioUrl(mainAudioUrl);
      console.log('[NEW-SECTION-PLAYER] ✓ Main audio resolved');
    }
    
    setPreResolved(true);
    const readyCount = resolved.filter(Boolean).length;
    console.log(`[NEW-SECTION-PLAYER] ✅ Pre-resolve completed SYNCHRONOUSLY: ${readyCount}/${sections.length} URLs ready`);
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
        {t('noAudioContent', lang)}
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
        lang={lang}
      />
    </div>
  );
};