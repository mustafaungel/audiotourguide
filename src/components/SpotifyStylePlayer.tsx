import React, { useState, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, ChevronDown, Volume2, VolumeX, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { useSpotifyAudio } from '@/hooks/useSpotifyAudio';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSwipeable } from 'react-swipeable';
import { haptics } from '@/lib/haptics';
import { ChapterList } from './ChapterList';
import { BottomSheet } from './ui/bottom-sheet';
import { cn } from '@/lib/utils';
import { extractDominantColor, createGradientFromColor } from '@/lib/color-utils';
import { useAudioPreload } from '@/hooks/useAudioPreload';

interface Section {
  id: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
  start_time?: number;
}

interface SpotifyStylePlayerProps {
  guide: {
    id: string;
    title: string;
    description?: string;
    audio_url?: string;
    image_url?: string;
  };
  sections?: Section[];
  accessCode?: string;
  onClose?: () => void;
}

export const SpotifyStylePlayer: React.FC<SpotifyStylePlayerProps> = ({
  guide,
  sections = [],
  accessCode,
  onClose,
}) => {
  const isMobile = useIsMobile();
  
  // UI State
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSectionData, setCurrentSectionData] = useState<Section | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedSheet, setShowSpeedSheet] = useState(false);
  const [touchFeedback, setTouchFeedback] = useState(false);
  const [dominantColor, setDominantColor] = useState<string>('hsl(var(--primary))');

  // Audio Hook
  const {
    isPlaying,
    loading,
    currentTime,
    duration,
    volume,
    currentSection,
    isShuffled,
    repeatMode,
    play,
    pause,
    seek,
    playSection,
    nextSection,
    previousSection,
    setVolume: setVolumeLevel,
    setSpeed: setSpeedLevel,
    toggleShuffle,
    toggleRepeat,
    skip,
  } = useSpotifyAudio({
    guideId: guide.id,
    sections,
    mainAudioUrl: guide.audio_url,
    accessCode,
    title: guide.title,
  });

  // Preload next section
  useAudioPreload(sections, currentSection);

  // Extract dominant color from album art
  useEffect(() => {
    if (guide.image_url) {
      extractDominantColor(guide.image_url).then(setDominantColor);
    }
  }, [guide.image_url]);

  // Sync section data
  useEffect(() => {
    if (sections.length > 0 && currentSection >= 0) {
      setCurrentSectionData(sections[currentSection]);
    }
  }, [currentSection, sections]);

  // Sync volume
  useEffect(() => {
    if (isMuted) {
      setVolumeLevel(0);
    }
  }, [isMuted, setVolumeLevel]);

  // Sync playback speed
  useEffect(() => {
    setSpeedLevel(playbackSpeed);
  }, [playbackSpeed, setSpeedLevel]);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    haptics.medium();
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolumeLevel(vol);
    setIsMuted(vol === 0);
  };

  const handleMute = () => {
    haptics.light();
    setIsMuted(!isMuted);
    if (!isMuted) {
      setVolumeLevel(0);
    } else {
      setVolumeLevel(volume || 50);
    }
  };

  const handleSeek = (newProgress: number[]) => {
    const newTime = (newProgress[0] / 100) * duration;
    seek(newTime);
  };

  const handleSkip = (seconds: number) => {
    haptics.light();
    skip(seconds);
  };

  const handleSpeedChange = (speed: number) => {
    haptics.selection();
    setPlaybackSpeed(speed);
    setShowSpeedSheet(false);
  };

  const handlePlaySection = (index: number) => {
    haptics.medium();
    playSection(index);
  };

  const handleNextSection = () => {
    haptics.light();
    nextSection();
  };

  const handlePreviousSection = () => {
    haptics.light();
    previousSection();
  };

  const handleToggleShuffle = () => {
    haptics.light();
    toggleShuffle();
  };

  const handleToggleRepeat = () => {
    haptics.light();
    toggleRepeat();
  };

  const handleExpand = () => {
    haptics.medium();
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    haptics.medium();
    setIsExpanded(false);
  };

  const handleDoubleTap = () => {
    handlePlayPause();
  };

  // Swipe gestures
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isExpanded && sections.length > 1) {
        haptics.light();
        handleNextSection();
      }
    },
    onSwipedRight: () => {
      if (isExpanded && sections.length > 1) {
        haptics.light();
        handlePreviousSection();
      }
    },
    onSwipedDown: () => {
      if (isExpanded) {
        handleCollapse();
      }
    },
    onSwipedUp: () => {
      if (!isExpanded) {
        handleExpand();
      }
    },
    trackMouse: false,
    preventScrollOnSwipe: true,
  });

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayTitle = currentSectionData?.title || guide.title;
  const displaySubtitle = sections.length > 0 
    ? `${currentSection + 1} of ${sections.length} • ${guide.title}`
    : guide.description || guide.title;

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  return (
    <>
      {/* Main Player Container */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 spring-animation",
          isExpanded ? "top-0" : "h-[88px]"
        )}
        style={{
          background: isExpanded 
            ? createGradientFromColor(dominantColor)
            : 'hsl(var(--card))',
        }}
      >
        {isExpanded ? (
          // ===== EXPANDED PLAYER =====
          <div className="h-full flex flex-col p-4 pt-safe-top pb-safe-bottom overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCollapse}
                className="rounded-full h-10 w-10"
                aria-label="Collapse player"
              >
                <ChevronDown className="h-6 w-6" />
              </Button>
              <div className="text-center flex-1">
                <p className="text-xs font-medium text-muted-foreground">Now Playing</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full h-10 w-10"
                aria-label="Close player"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Album Art */}
            <div 
              {...swipeHandlers}
              className={cn(
                "relative mx-auto mb-6 transition-transform duration-200",
                touchFeedback && "scale-95",
                isMobile ? "w-[280px] h-[280px]" : "w-[320px] h-[320px]"
              )}
              onDoubleClick={handleDoubleTap}
              onTouchStart={() => setTouchFeedback(true)}
              onTouchEnd={() => setTouchFeedback(false)}
            >
              <img
                src={guide.image_url || '/placeholder.svg'}
                alt={guide.title}
                className="w-full h-full object-cover rounded-3xl shadow-2xl"
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-3xl backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="text-center mb-6 px-4">
              <h2 className="ios-title-large text-foreground mb-2 line-clamp-2">
                {displayTitle}
              </h2>
              <p className="ios-body text-muted-foreground line-clamp-1">
                {displaySubtitle}
              </p>
            </div>

            {/* Progress Slider */}
            <div className="mb-8 px-2">
              <Slider
                value={[progress]}
                max={100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
                aria-label="Seek audio"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSkip(-15)}
                className="h-12 w-12 rounded-full"
                aria-label="Skip back 15 seconds"
              >
                <SkipBack className="h-6 w-6" />
              </Button>

              <Button
                onClick={handlePlayPause}
                disabled={loading}
                className={cn(
                  "h-18 w-18 rounded-full shadow-lg transition-all duration-300",
                  "bg-primary hover:bg-primary/90",
                  isPlaying && "play-button-glow"
                )}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                aria-pressed={isPlaying}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" fill="currentColor" />
                ) : (
                  <Play className="h-8 w-8 ml-1" fill="currentColor" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSkip(15)}
                className="h-12 w-12 rounded-full"
                aria-label="Skip forward 15 seconds"
              >
                <SkipForward className="h-6 w-6" />
              </Button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-center gap-6 mb-6">
              {sections.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleShuffle}
                  className={cn(
                    "h-9 w-9 rounded-full",
                    isShuffled && "text-primary"
                  )}
                  aria-label="Toggle shuffle"
                  aria-pressed={isShuffled}
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleRepeat}
                  className={cn(
                    "h-9 w-9 rounded-full",
                    repeatMode !== 'none' && "text-primary"
                  )}
                  aria-label="Toggle repeat"
                  aria-pressed={repeatMode !== 'none'}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSpeedSheet(true)}
                className="h-9 w-9 rounded-full text-xs font-medium"
                aria-label="Change playback speed"
              >
                {playbackSpeed}x
              </Button>

              {!isMobile && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleMute}
                    className="h-9 w-9 rounded-full"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                    aria-label="Volume"
                  />
                </div>
              )}
            </div>

            {/* Chapter List */}
            {sections.length > 0 && (
              <div className="mt-auto">
                <ChapterList
                  sections={sections}
                  currentSectionIndex={currentSection}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onPlaySection={handlePlaySection}
                  onTogglePlay={handlePlayPause}
                />
              </div>
            )}
          </div>
        ) : (
          // ===== COLLAPSED PLAYER =====
          <div 
            className="h-full flex items-center px-4 gap-3 ios-player-card border-t border-border/50"
          >
            {/* Album Art */}
            <div 
              className="flex-shrink-0 cursor-pointer"
              onClick={handleExpand}
            >
              <img
                src={guide.image_url || '/placeholder.svg'}
                alt={guide.title}
                className="w-16 h-16 object-cover rounded-lg shadow-md"
              />
            </div>

            {/* Track Info */}
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={handleExpand}
            >
              <h3 className="font-semibold text-sm text-foreground truncate">
                {displayTitle}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {sections.length > 0 ? `${sections.length} chapters` : guide.description}
              </p>
              
              {/* Mini Progress Bar */}
              <div className="mt-2">
                <div className="h-0.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Play Button */}
            <Button
              onClick={handlePlayPause}
              disabled={loading}
              size="icon"
              className="flex-shrink-0 h-12 w-12 rounded-full bg-primary hover:bg-primary/90 shadow-md"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Speed Control Bottom Sheet */}
      <BottomSheet
        open={showSpeedSheet}
        onOpenChange={setShowSpeedSheet}
        title="Playback Speed"
        defaultSnap="mini"
      >
        <div className="space-y-2 py-4">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={cn(
                "w-full text-center py-3 px-4 rounded-xl transition-all",
                "hover:bg-muted/50 active:scale-[0.98]",
                playbackSpeed === speed
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground"
              )}
            >
              {speed}x
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* Accessibility */}
      <div role="status" aria-live="polite" className="sr-only">
        {isPlaying ? 'Playing' : 'Paused'} {displayTitle}
      </div>
    </>
  );
};
