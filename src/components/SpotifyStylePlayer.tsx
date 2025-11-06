import React, { useState, useEffect } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, ChevronDown, Volume2, VolumeX, Shuffle, Repeat, Repeat1, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Badge } from './ui/badge';
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Audio Hook
  const {
    isPlaying,
    loading,
    isBuffering,
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

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Extract dominant color from album art
  useEffect(() => {
    if (guide.image_url) {
      extractDominantColor(guide.image_url).then(setDominantColor);
    }
  }, [guide.image_url]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
        case 'j':
          e.preventDefault();
          handleSkip(-10);
          break;
        case 'ArrowRight':
        case 'l':
          e.preventDefault();
          handleSkip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(100, volume * 100 + 10)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume * 100 - 10)]);
          break;
        case 'm':
          e.preventDefault();
          handleMute();
          break;
        case 'n':
          e.preventDefault();
          handleNextSection();
          break;
        case 'p':
          e.preventDefault();
          handlePreviousSection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, volume, currentTime, duration]);

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

  const handleNext = () => {
    haptics.light();
    nextSection();
  };

  const handlePrevious = () => {
    haptics.light();
    previousSection();
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
          isExpanded ? "top-0" : "h-[110px]"
        )}
        style={{
          background: isExpanded 
            ? createGradientFromColor(dominantColor)
            : 'hsl(var(--card))',
        }}
      >
        {isExpanded ? (
          // ===== EXPANDED PLAYER =====
          <div className="h-full flex flex-col pt-safe-top overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0">
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

            {/* Chapter List - At Top, Scrollable */}
            {sections.length > 0 && (
              <div className="max-h-[45vh] overflow-y-auto px-4 flex-shrink-0">
                <ChapterList
                  sections={sections}
                  currentSectionIndex={currentSection}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  duration={duration}
                  onPlaySection={handlePlaySection}
                  onTogglePlay={handlePlayPause}
                  onSkip={handleSkip}
                  onPreviousSection={handlePreviousSection}
                  onNextSection={handleNextSection}
                  onSpeedChange={handleSpeedChange}
                  playbackSpeed={playbackSpeed}
                />
              </div>
            )}

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto px-4">
              <div 
                {...swipeHandlers}
                className={cn(
                  "relative mx-auto mb-6 mt-6 transition-transform duration-200",
                  touchFeedback && "scale-95",
                  isMobile ? "w-[240px] h-[240px]" : "w-[280px] h-[280px]"
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
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2 line-clamp-2">
                  {displayTitle}
                </h2>
                <p className="text-base text-muted-foreground line-clamp-1">
                  {displaySubtitle}
                </p>
              </div>

              {/* Progress Slider */}
              <div className="mb-6 px-2">
                <Slider
                  value={[progress]}
                  max={100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer h-2"
                  aria-label="Seek audio"
                />
                <div className="flex justify-between items-center mt-2 text-sm font-semibold text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  {!isOnline && (
                    <Badge variant="secondary" className="gap-1 text-xs py-0 px-2">
                      <WifiOff className="h-3 w-3" />
                      Offline
                    </Badge>
                  )}
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Sticky Controls - Always at Bottom */}
            <div className="sticky bottom-0 bg-background/95 backdrop-blur-lg border-t border-border/50 px-4 py-4 pb-safe-bottom z-20 flex-shrink-0">
              {/* Main Controls */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSkip(-15)}
                  className="h-14 w-14 rounded-full"
                  aria-label="Skip back 15 seconds"
                >
                  <SkipBack className="h-6 w-6" />
                </Button>

                <Button
                  onClick={handlePlayPause}
                  disabled={loading || isBuffering}
                  className={cn(
                    "h-20 w-20 rounded-full shadow-lg transition-all duration-300",
                    "bg-primary hover:bg-primary/90",
                    isPlaying && "play-button-glow"
                  )}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  aria-pressed={isPlaying}
                >
                  {loading || isBuffering ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isPlaying ? (
                    <Pause className="h-8 w-8" fill="currentColor" />
                  ) : (
                    <Play className="h-8 w-8 ml-1" fill="currentColor" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSkip(15)}
                  className="h-14 w-14 rounded-full"
                  aria-label="Skip forward 15 seconds"
                >
                  <SkipForward className="h-6 w-6" />
                </Button>
              </div>

              {/* Secondary Controls */}
              <div className="flex items-center justify-center gap-6">
                {sections.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleShuffle}
                    className={cn(
                      "h-10 w-10 rounded-full",
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
                    "h-10 w-10 rounded-full",
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
                  size="sm"
                  onClick={() => {
                    haptics.medium();
                    setShowSpeedSheet(true);
                  }}
                  className="h-10 px-4 rounded-full bg-muted/50 hover:bg-muted"
                  aria-label="Change playback speed"
                >
                  <span className="text-sm font-medium">{playbackSpeed}×</span>
                </Button>

                {!isMobile && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleMute}
                      className="h-10 w-10 rounded-full"
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
            </div>
          </div>
        ) : (
          // ===== COLLAPSED PLAYER =====
          <div 
            className="h-full flex items-center px-4 gap-3 ios-player-card border-t border-border/50"
          >
            {/* Album Art */}
            <div 
              className="flex-shrink-0 cursor-pointer transition-transform active:scale-95"
              onClick={handleExpand}
            >
              <img
                src={guide.image_url || '/placeholder.svg'}
                alt={guide.title}
                className="w-18 h-18 object-cover rounded-2xl shadow-lg"
              />
            </div>

            {/* Track Info */}
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={handleExpand}
            >
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-medium text-foreground truncate flex-1">
                  {displayTitle}
                </h3>
                {!isOnline && (
                  <Badge variant="secondary" className="gap-1 text-xs py-0 px-1.5 shrink-0">
                    <WifiOff className="h-2.5 w-2.5" />
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mb-2">
                {sections.length > 0 ? `${sections.length} chapters` : guide.description}
              </p>
              
              {/* Mini Progress Bar */}
              <div>
                <div className="h-[2.5px] bg-muted/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 shadow-sm"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Compact Controls */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Previous Section */}
              {sections.length > 1 && (
                <Button
                  onClick={handlePreviousSection}
                  disabled={currentSection <= 0}
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 min-h-[36px] rounded-full touch-manipulation"
                  aria-label="Previous section"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
              )}

              {/* Play/Pause Button */}
              <Button
                onClick={handlePlayPause}
                disabled={loading || isBuffering}
                size="icon"
                className="flex-shrink-0 h-14 w-14 min-h-[56px] rounded-full bg-primary hover:bg-primary/90 shadow-md touch-manipulation"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {loading || isBuffering ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" fill="currentColor" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
                )}
              </Button>

              {/* Next Section */}
              {sections.length > 1 && (
                <Button
                  onClick={handleNextSection}
                  disabled={currentSection >= sections.length - 1}
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 min-h-[36px] rounded-full touch-manipulation"
                  aria-label="Next section"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              )}

              {/* Speed Badge - Always Visible */}
              <div className="h-8 px-3 rounded-full bg-muted/50 flex items-center justify-center ml-1">
                <span className="text-xs font-semibold">{playbackSpeed}×</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Speed Control Bottom Sheet - iOS Wheel Picker Style */}
      <BottomSheet
        open={showSpeedSheet}
        onOpenChange={setShowSpeedSheet}
        title="Playback Speed"
        defaultSnap="mini"
      >
        <div className="pb-6">
          <div className="ios-picker-container relative h-48 overflow-hidden">
            {/* Picker highlight */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-muted/30 rounded-lg pointer-events-none z-10" />
            
            <div className="space-y-1">
              {speedOptions.map((speed) => {
                const isSelected = playbackSpeed === speed;
                return (
                  <button
                    key={speed}
                    onClick={() => {
                      handleSpeedChange(speed);
                      haptics.selection();
                      setTimeout(() => setShowSpeedSheet(false), 200);
                    }}
                    className={cn(
                      "w-full h-10 flex items-center justify-center rounded-lg transition-all duration-200",
                      "touch-manipulation",
                      isSelected && "font-bold text-primary scale-105"
                    )}
                  >
                    <span className={cn(
                      "text-base transition-all",
                      isSelected ? "text-lg font-semibold" : "text-muted-foreground"
                    )}>
                      {speed === 1.0 ? 'Normal' : `${speed}×`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Accessibility */}
      <div role="status" aria-live="polite" className="sr-only">
        {isBuffering ? 'Buffering' : isPlaying ? 'Playing' : 'Paused'}: {displayTitle}
        {!isOnline && ' - Offline mode'}
      </div>
    </>
  );
};
