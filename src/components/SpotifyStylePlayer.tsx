import React, { useState, useRef, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown,
  X,
  Shuffle,
  Repeat,
  Download,
  Share
} from 'lucide-react';
import { useSpotifyAudio } from '@/hooks/useSpotifyAudio';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
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
  className?: string;
}

export const SpotifyStylePlayer: React.FC<SpotifyStylePlayerProps> = ({
  guide,
  sections = [],
  accessCode,
  onClose,
  className
}) => {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedControls, setShowSpeedControls] = useState(false);
  const [touchFeedback, setTouchFeedback] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const audioHook = useSpotifyAudio({
    guideId: guide.id,
    sections,
    mainAudioUrl: guide.audio_url,
    accessCode,
    title: guide.title
  });

  const {
    isPlaying,
    loading,
    currentTime,
    duration,
    progress,
    volume,
    playbackSpeed: hookPlaybackSpeed,
    currentSection: hookCurrentSection,
    currentSectionData,
    isShuffled,
    repeatMode,
    play,
    pause,
    seek,
    skip,
    playSection,
    nextSection: hookNextSection,
    previousSection: hookPreviousSection,
    setVolume,
    setSpeed,
    toggleShuffle,
    toggleRepeat,
    cleanup
  } = audioHook;

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Sync local state with hook state
  useEffect(() => {
    setCurrentSection(hookCurrentSection);
  }, [hookCurrentSection]);

  useEffect(() => {
    setPlaybackSpeed(hookPlaybackSpeed);
  }, [hookPlaybackSpeed]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0] / 100;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const handleMute = () => {
    if (isMuted) {
      setVolume(volume > 0 ? volume : 0.5);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleSeek = (newProgress: number[]) => {
    const newTime = (newProgress[0] / 100) * duration;
    seek(newTime);
  };

  const handleSkip = (seconds: number) => {
    skip(seconds);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    setSpeed(speed);
    setShowSpeedControls(false);
  };

  const handlePlaySection = (index: number) => {
    playSection(index);
  };

  const handleNextSection = () => {
    hookNextSection();
  };

  const handlePreviousSection = () => {
    hookPreviousSection();
  };

  // Mobile swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (sections.length > 0 && hookCurrentSection < sections.length - 1) {
        handleNextSection();
        setTouchFeedback('next');
        setTimeout(() => setTouchFeedback(''), 300);
      }
    },
    onSwipedRight: () => {
      if (sections.length > 0 && hookCurrentSection > 0) {
        handlePreviousSection();
        setTouchFeedback('prev');
        setTimeout(() => setTouchFeedback(''), 300);
      }
    },
    onSwipedDown: () => {
      if (isExpanded) {
        setIsExpanded(false);
        setTouchFeedback('collapse');
        setTimeout(() => setTouchFeedback(''), 300);
      }
    },
    onSwipedUp: () => {
      if (!isExpanded) {
        setIsExpanded(true);
        setTouchFeedback('expand');
        setTimeout(() => setTouchFeedback(''), 300);
      }
    },
    trackMouse: !isMobile,
    touchEventOptions: { passive: false }
  });

  return (
    <div 
      ref={containerRef}
      {...swipeHandlers}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        isExpanded ? "top-0" : "",
        className
      )}
    >
      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="absolute inset-0 bg-gradient-primary opacity-20"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <Card className={cn(
        "relative bg-gradient-card border-0 rounded-none transition-all duration-500",
        isExpanded 
          ? "h-full rounded-t-xl" 
          : isMobile 
            ? "h-20 rounded-t-xl shadow-tourism safe-bottom" 
            : "h-24 rounded-t-xl shadow-tourism",
        touchFeedback && "animate-pulse"
      )}>
        
        {/* Collapsed Player */}
        {!isExpanded && (
          <div className={cn(
            "flex items-center h-full relative",
            isMobile ? "px-3 py-2" : "p-4"
          )}>
            {/* Swipe indicator */}
            {isMobile && (
              <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-muted-foreground/30 rounded-full" />
            )}

            {/* Album Art */}
            <div className={cn(
              "flex-shrink-0",
              isMobile ? "mr-3" : "mr-4"
            )}>
              <div className={cn(
                "bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow",
                isMobile ? "w-10 h-10" : "w-12 h-12"
              )}>
                {guide.image_url ? (
                  <img 
                    src={guide.image_url} 
                    alt={guide.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Play className={cn(
                    "text-primary-foreground",
                    isMobile ? "w-5 h-5" : "w-6 h-6"
                  )} />
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className={cn(
              "flex-1 min-w-0",
              isMobile ? "mr-2" : "mr-4"
            )}>
              <h3 className={cn(
                "font-semibold text-foreground truncate",
                isMobile ? "text-xs" : "text-sm"
              )}>
                {currentSectionData?.title || guide.title}
              </h3>
              <p className={cn(
                "text-muted-foreground truncate",
                isMobile ? "text-xs" : "text-xs"
              )}>
                {sections.length > 0 ? `${sections.length} chapters` : 'Audio Guide'}
              </p>
            </div>

            {/* Quick Controls */}
            <div className={cn(
              "flex items-center",
              isMobile ? "gap-1" : "gap-2"
            )}>
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSkip(-15)}
                  className="h-10 w-10 touch-manipulation"
                >
                  <SkipBack className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                onClick={handlePlayPause}
                disabled={loading}
                size="icon"
                className={cn(
                  "bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow touch-manipulation",
                  isMobile ? "h-8 w-8" : "h-10 w-10"
                )}
              >
                {loading ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
                ) : (
                  <Play className={cn(
                    isMobile ? "w-3 h-3 ml-0.5" : "w-4 h-4 ml-0.5"
                  )} />
                )}
              </Button>

              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSkip(15)}
                  className="h-10 w-10 touch-manipulation"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(true)}
                className={cn(
                  "touch-manipulation",
                  isMobile ? "h-8 w-8" : "h-10 w-10"
                )}
              >
                <ChevronUp className={cn(isMobile ? "w-3 h-3" : "w-4 h-4")} />
              </Button>
            </div>

            {/* Touch feedback overlay */}
            {touchFeedback && (
              <div className="absolute inset-0 bg-primary/10 rounded-lg animate-pulse pointer-events-none" />
            )}
          </div>
        )}

        {/* Expanded Player */}
        {isExpanded && (
          <div className="flex flex-col h-full safe-top safe-bottom">
            {/* Header */}
            <div className={cn(
              "flex items-center justify-between border-b border-border/20",
              isMobile ? "p-3" : "p-4"
            )}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className={cn(
                  "touch-manipulation",
                  isMobile ? "h-10 w-10" : ""
                )}
              >
                <ChevronDown className={cn(isMobile ? "w-6 h-6" : "w-5 h-5")} />
              </Button>
              
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Playing from</p>
                <p className="text-sm font-semibold text-foreground truncate max-w-32">
                  {guide.title}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="touch-manipulation">
                  <Share className={cn(isMobile ? "w-6 h-6" : "w-5 h-5")} />
                </Button>
                {onClose && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose}
                    className="touch-manipulation"
                  >
                    <X className={cn(isMobile ? "w-6 h-6" : "w-5 h-5")} />
                  </Button>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className={cn(
              "flex-1 flex flex-col space-y-6 overflow-y-auto",
              isMobile ? "p-4" : "p-6"
            )}>
              {/* Album Art */}
              <div className="flex justify-center">
                <div className={cn(
                  "bg-gradient-primary rounded-2xl shadow-tourism flex items-center justify-center",
                  isMobile ? "w-48 h-48" : "w-64 h-64"
                )}>
                  {guide.image_url ? (
                    <img 
                      src={guide.image_url} 
                      alt={guide.title}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <Play className={cn(
                      "text-primary-foreground",
                      isMobile ? "w-16 h-16" : "w-24 h-24"
                    )} />
                  )}
                </div>
              </div>

              {/* Track Info */}
              <div className="text-center space-y-2">
                <h1 className={cn(
                  "font-bold text-foreground",
                  isMobile ? "text-xl" : "text-2xl"
                )}>
                  {currentSectionData?.title || guide.title}
                </h1>
                <p className={cn(
                  "text-muted-foreground",
                  isMobile ? "text-base" : "text-lg"
                )}>
                  {guide.description || 'Audio Guide'}
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <Slider
                  value={[progress]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="w-full h-2 touch-manipulation"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Main Controls */}
              <div className={cn(
                "flex items-center justify-center",
                isMobile ? "gap-4" : "gap-6"
              )}>
                {!isMobile && (
                  <Button variant="ghost" size="icon" className="touch-manipulation">
                    <Shuffle className="w-5 h-5" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousSection}
                  disabled={hookCurrentSection === 0}
                  className={cn(
                    "touch-manipulation",
                    isMobile ? "h-14 w-14" : "h-12 w-12"
                  )}
                >
                  <SkipBack className={cn(isMobile ? "w-8 h-8" : "w-6 h-6")} />
                </Button>

                <Button
                  onClick={handlePlayPause}
                  disabled={loading}
                  size="lg"
                  className={cn(
                    "bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow touch-manipulation rounded-full",
                    isMobile ? "h-20 w-20" : "h-16 w-16"
                  )}
                >
                  {loading ? (
                    <div className={cn(
                      "animate-spin rounded-full border-2 border-current border-t-transparent",
                      isMobile ? "w-10 h-10" : "w-8 h-8"
                    )} />
                  ) : isPlaying ? (
                    <Pause className={cn(isMobile ? "w-10 h-10" : "w-8 h-8")} />
                  ) : (
                    <Play className={cn(
                      isMobile ? "w-10 h-10 ml-1" : "w-8 h-8 ml-1"
                    )} />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextSection}
                  disabled={hookCurrentSection >= sections.length - 1}
                  className={cn(
                    "touch-manipulation",
                    isMobile ? "h-14 w-14" : "h-12 w-12"
                  )}
                >
                  <SkipForward className={cn(isMobile ? "w-8 h-8" : "w-6 h-6")} />
                </Button>

                {!isMobile && (
                  <Button variant="ghost" size="icon" className="touch-manipulation">
                    <Repeat className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* Secondary Controls */}
              {!isMobile && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleMute}
                      onMouseEnter={() => setShowVolumeSlider(true)}
                      onMouseLeave={() => setShowVolumeSlider(false)}
                      className="touch-manipulation relative"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </Button>
                    
                    {showVolumeSlider && (
                      <div className="w-24">
                        <Slider
                          value={[volume * 100]}
                          onValueChange={handleVolumeChange}
                          max={100}
                          step={1}
                          className="h-1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSpeedControls(!showSpeedControls)}
                      className="text-sm touch-manipulation"
                    >
                      {playbackSpeed}x
                    </Button>
                    
                    {showSpeedControls && (
                      <div className="absolute bottom-full right-0 mb-2 bg-card border border-border rounded-lg p-2 shadow-tourism">
                        <div className="grid grid-cols-2 gap-1">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <Button
                              key={speed}
                              variant={playbackSpeed === speed ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() => handleSpeedChange(speed)}
                              className="text-xs touch-manipulation"
                            >
                              {speed}x
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mobile Speed Control */}
              {isMobile && (
                <div className="flex justify-center">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSpeedControls(!showSpeedControls)}
                      className="text-sm touch-manipulation min-h-12"
                    >
                      Speed: {playbackSpeed}x
                    </Button>
                    
                    {showSpeedControls && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-card border border-border rounded-lg p-2 shadow-tourism">
                        <div className="grid grid-cols-3 gap-1">
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <Button
                              key={speed}
                              variant={playbackSpeed === speed ? "secondary" : "ghost"}
                              size="sm"
                              onClick={() => handleSpeedChange(speed)}
                              className="text-xs touch-manipulation min-h-10"
                            >
                              {speed}x
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Playlist */}
              {sections.length > 0 && (
                <div className="flex-1 min-h-0">
                  <h3 className={cn(
                    "font-semibold mb-4 text-foreground",
                    isMobile ? "text-base" : "text-lg"
                  )}>Chapters</h3>
                  <div className={cn(
                    "space-y-2 overflow-y-auto",
                    isMobile ? "max-h-64" : "max-h-96"
                  )}>
                    {sections.map((section, index) => (
                      <div
                        key={section.id}
                        onClick={() => handlePlaySection(index)}
                        className={cn(
                          "flex items-center rounded-lg cursor-pointer transition-all touch-manipulation",
                          isMobile ? "p-2 min-h-14" : "p-3",
                          index === hookCurrentSection 
                            ? "bg-primary/10 border border-primary/20" 
                            : "hover:bg-muted/50 active:bg-muted/70"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center mr-3",
                          isMobile ? "w-6 h-6" : "w-8 h-8"
                        )}>
                          {index === hookCurrentSection && isPlaying ? (
                            <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                          ) : (
                            <span className={cn(
                              "text-muted-foreground",
                              isMobile ? "text-xs" : "text-sm"
                            )}>
                              {index + 1}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium text-foreground truncate",
                            isMobile ? "text-sm" : "text-base"
                          )}>
                            {section.title}
                          </p>
                          {section.description && !isMobile && (
                            <p className="text-sm text-muted-foreground truncate">
                              {section.description}
                            </p>
                          )}
                        </div>
                        
                        {section.duration_seconds && (
                          <span className={cn(
                            "text-muted-foreground ml-2",
                            isMobile ? "text-xs" : "text-sm"
                          )}>
                            {formatTime(section.duration_seconds)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress bar for collapsed state */}
        {!isExpanded && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted">
            <div 
              className="h-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </Card>
    </div>
  );
};