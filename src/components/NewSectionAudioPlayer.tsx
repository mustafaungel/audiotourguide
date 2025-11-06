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
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { markChapterCompleted, isChapterCompleted, autoAdvanceEnabled, setAutoAdvance } = useAudioProgress({ guideId });

  // Determine if we have section-based audio or main audio
  const hasIndividualSections = sections.some(section => section.audio_url);
  const audioMode = hasIndividualSections ? 'sections' : 'main';

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

  const playSection = async (sectionIndex: number) => {
    if (sectionIndex < 0 || sectionIndex >= sections.length) {
      console.error('[NEW-SECTION-PLAYER] Invalid section index:', sectionIndex);
      return;
    }
    
    console.log('[NEW-SECTION-PLAYER] Play section called:', {
      sectionIndex,
      currentIndex: currentSectionIndex,
      isPlaying,
      audioMode
    });
    
    // Smart toggle: if same section is playing, pause it
    if (sectionIndex === currentSectionIndex && isPlaying) {
      console.log('[NEW-SECTION-PLAYER] Toggling pause for current section');
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }
    
    setLoading(true);
    setCurrentSectionIndex(sectionIndex);
    
    try {
      // Stop current audio if playing
      if (audioRef.current) {
        console.log('[NEW-SECTION-PLAYER] Stopping current audio');
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Load audio URL with proper error handling
      let audioUrl: string | null = null;
      
      if (audioMode === 'sections') {
        const section = sections[sectionIndex];
        console.log('[NEW-SECTION-PLAYER] Loading section audio:', {
          title: section.title,
          hasAudioUrl: !!section.audio_url
        });
        audioUrl = await loadAudioSource(section.audio_url, sectionIndex);
      } else {
        console.log('[NEW-SECTION-PLAYER] Loading main audio URL');
        audioUrl = await loadAudioSource(mainAudioUrl, sectionIndex);
      }

      if (!audioUrl) {
        console.error('[NEW-SECTION-PLAYER] Failed to load audio URL');
        throw new Error('Audio URL is empty');
      }

      console.log('[NEW-SECTION-PLAYER] Audio URL loaded successfully:', audioUrl.substring(0, 50) + '...');

      // Create or reuse audio element
      if (!audioRef.current) {
        console.log('[NEW-SECTION-PLAYER] Creating new Audio element');
        audioRef.current = new Audio();
        setupAudioElement(audioRef.current);
      }

      // Set audio source and properties
      console.log('[NEW-SECTION-PLAYER] Setting audio properties and starting playback');
      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackSpeed;
      
      // Attempt playback
      await audioRef.current.play();
      setIsPlaying(true);
      console.log('[NEW-SECTION-PLAYER] Playback started successfully');
      
      toast({
        title: 'Now Playing',
        description: sections[sectionIndex]?.title || guideTitle,
      });
      
    } catch (error) {
      console.error('[NEW-SECTION-PLAYER] Play error:', error);
      
      // Provide more specific error message
      let errorMsg = 'Failed to start playback';
      if (error instanceof Error) {
        if (error.message.includes('NotAllowedError') || error.name === 'NotAllowedError') {
          errorMsg = 'Please tap the play button again to start playback';
        } else if (error.message.includes('NotSupportedError') || error.name === 'NotSupportedError') {
          errorMsg = 'Audio format not supported on this device';
        }
      }
      
      toast({
        title: 'Playback Error',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || currentSectionIndex === -1) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src) {
        await playSection(currentSectionIndex);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
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