import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChapterList } from '@/components/ChapterList';
import { MiniPlayer } from '@/components/MiniPlayer';
import { ExpandedPlayer } from '@/components/ExpandedPlayer';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudioProgress } from '@/hooks/useAudioProgress';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/translations';
import { cn } from '@/lib/utils';

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
  guideImageUrl?: string;
  insideSheet?: boolean;
  lang?: string;
}

export const NewSectionAudioPlayer: React.FC<NewSectionAudioPlayerProps> = ({
  guideId,
  guideTitle,
  sections,
  mainAudioUrl,
  guideImageUrl,
  insideSheet = false,
  lang = 'en'
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);
  // portalTarget removed — MiniPlayer always portals to document.body when insideSheet
  
  // Keep last valid sections to prevent empty flash during language switch
  const lastValidSectionsRef = useRef<Section[]>([]);
  
  const resolvedUrlsRef = useRef<(string | undefined)[]>([]);
  const resolvedMainRef = useRef<string | undefined>(undefined);
  const [preResolved, setPreResolved] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { markChapterCompleted, isChapterCompleted, autoAdvanceEnabled, setAutoAdvance } = useAudioProgress({ guideId });

  // Track last valid sections
  useEffect(() => {
    if (sections.length > 0) {
      lastValidSectionsRef.current = sections;
    }
  }, [sections]);

  // When sections change (e.g. language switch), stop current audio and reset
  const prevSectionsRef = useRef<Section[]>(sections);
  useEffect(() => {
    if (prevSectionsRef.current !== sections && sections.length > 0) {
      // Clear resolved URLs so new language URLs are used
      resolvedUrlsRef.current = [];

      if (audioRef.current) {
        const wasPlaying = isPlaying;
        const prevIndex = currentSectionIndex;

        // Stop current playback and clear src so resume uses new URL
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);

        // Auto-resume same section in new language if was playing
        if (wasPlaying && prevIndex >= 0 && prevIndex < sections.length) {
          setTimeout(() => playSection(prevIndex), 150);
        }
      }
    }
    prevSectionsRef.current = sections;
  }, [sections]);

  // Use current sections if available, otherwise show last valid ones
  const displaySections = sections.length > 0 ? sections : lastValidSectionsRef.current;

  const hasIndividualSections = displaySections.some(section => section.audio_url);
  const audioMode = hasIndividualSections ? 'sections' : 'main';

  const setupAudioElement = (audioElement: HTMLAudioElement) => {
    audioElement.addEventListener('timeupdate', () => {
      setCurrentTime(audioElement.currentTime);
      
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
      
      if (currentSectionIndex >= 0) {
        markChapterCompleted(currentSectionIndex);
      }
      
      if (audioMode === 'sections' && currentSectionIndex < displaySections.length - 1) {
        if (autoAdvanceEnabled) {
          setTimeout(() => {
            playSection(currentSectionIndex + 1);
          }, 500);
        } else {
          const nextChapterTitle = displaySections[currentSectionIndex + 1]?.title || t('playNext', lang);
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
      } else if (currentSectionIndex >= displaySections.length - 1) {
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

  const resolveAudioUrl = (audioPath?: string): string => {
    if (!audioPath) return `/tmp/${guideId}.mp3`;
    if (audioPath.startsWith('http://') || audioPath.startsWith('https://')) return audioPath;
    if (audioPath.startsWith('/storage/v1/object/public')) {
      return `https://dsaqlgxajdnwoqvtsrqd.supabase.co${audioPath}`;
    }
    const { data } = supabase.storage.from('guide-audio').getPublicUrl(audioPath);
    return data?.publicUrl || `/tmp/${guideId}.mp3`;
  };

  const playSection = (sectionIndex: number) => {
    if (sectionIndex < 0 || sectionIndex >= displaySections.length) return;
    
    if (sectionIndex === currentSectionIndex && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }
    
    setLoading(true);
    setCurrentSectionIndex(sectionIndex);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    let audioUrl = resolvedUrlsRef.current[sectionIndex];
    if (!audioUrl) {
      const section = displaySections[sectionIndex];
      audioUrl = resolveAudioUrl(section.audio_url);
      resolvedUrlsRef.current[sectionIndex] = audioUrl;
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
      audioRef.current.setAttribute('playsinline', '');
      
      setupAudioElement(audioRef.current);
    }
    
    audioRef.current.src = audioUrl;
    audioRef.current.volume = volume;
    audioRef.current.playbackRate = playbackSpeed;
    
    const playPromise = audioRef.current.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setLoading(false);
          toast({
            title: t('nowPlaying', lang),
            description: displaySections[sectionIndex]?.title || guideTitle,
          });
        })
        .catch((error: any) => {
          setLoading(false);
          setIsPlaying(false);
          if (error.name === 'NotAllowedError') {
            toast({ title: t('audioLocked', lang), description: t('tapToPlay', lang) });
          } else {
            toast({ title: t('playbackError', lang), description: t('playbackErrorDesc', lang), variant: 'destructive' });
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
          playPromise.then(() => setIsPlaying(true)).catch(() => {});
        }
      }
    }
  };

  const previousSection = () => { if (currentSectionIndex > 0) playSection(currentSectionIndex - 1); };
  const nextSection = () => { if (currentSectionIndex < displaySections.length - 1) playSection(currentSectionIndex + 1); };

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
    if (audioRef.current) audioRef.current.volume = vol;
  };

  const toggleMute = () => {
    if (isMuted) {
      const v = previousVolume > 0 ? previousVolume : 0.5;
      setVolume(v); setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = v;
    } else {
      setPreviousVolume(volume > 0 ? volume : 0.5);
      setVolume(0); setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Pre-resolve all audio URLs
  useEffect(() => {
    const resolved = displaySections.map((section) => {
      if (!section.audio_url) return mainAudioUrl ? resolveAudioUrl(mainAudioUrl) : `/tmp/${guideId}.mp3`;
      return resolveAudioUrl(section.audio_url);
    });
    resolvedUrlsRef.current = resolved;
    if (mainAudioUrl) resolvedMainRef.current = resolveAudioUrl(mainAudioUrl);
    setPreResolved(true);
  }, [displaySections, mainAudioUrl, guideId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const isActive = currentSectionIndex >= 0;

  // Stable empty state — fixed height to prevent layout shift
  if (!displaySections.length) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-muted-foreground text-sm">
        {t('noAudioContent', lang)}
      </div>
    );
  }

  const currentSection = displaySections[currentSectionIndex];

  const miniPlayerElement = isMobile && isActive && !isExpanded ? createPortal(
    <MiniPlayer
      title={currentSection?.title || guideTitle}
      currentTime={currentTime}
      duration={duration}
      isPlaying={isPlaying}
      loading={loading}
      imageUrl={guideImageUrl}
      playbackSpeed={playbackSpeed}
      variant="fixed"
      onTogglePlay={togglePlayPause}
      onExpand={() => setIsExpanded(true)}
      onSkipBack={() => skip(-15)}
      onSkipForward={() => skip(15)}
      onSpeedChange={handleSpeedChange}
    />,
    document.body
  ) : null;

  const expandedPlayerElement = isMobile ? (
    <ExpandedPlayer
      open={isExpanded}
      onClose={() => setIsExpanded(false)}
      title={currentSection?.title || guideTitle}
      guideTitle={guideTitle}
      chapterIndex={currentSectionIndex >= 0 ? currentSectionIndex : 0}
      totalChapters={displaySections.length}
      currentTime={currentTime}
      duration={duration}
      isPlaying={isPlaying}
      loading={loading}
      imageUrl={guideImageUrl}
      playbackSpeed={playbackSpeed}
      canGoNext={currentSectionIndex < displaySections.length - 1}
      canGoPrevious={currentSectionIndex > 0}
      onTogglePlay={togglePlayPause}
      onSeek={handleSeek}
      onSkip={skip}
      onPrevious={previousSection}
      onNext={nextSection}
      onSpeedChange={handleSpeedChange}
      lang={lang}
    />
  ) : null;

  return (
    <div className="space-y-6">
      <ChapterList
        sections={displaySections}
        currentSectionIndex={currentSectionIndex}
        isPlaying={isPlaying}
        loading={loading}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        playbackSpeed={playbackSpeed}
        canGoNext={currentSectionIndex < displaySections.length - 1}
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
        hideMobileControls={isActive && isMobile}
      />
      {miniPlayerElement}
      {expandedPlayerElement}
    </div>
  );
};
