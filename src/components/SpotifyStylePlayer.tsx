import React, { useState, useRef, useEffect } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedControls, setShowSpeedControls] = useState(false);
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

  return (
    <div 
      ref={containerRef}
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
          : "h-20 md:h-24 rounded-t-xl shadow-tourism"
      )}>
        
        {/* Collapsed Player */}
        {!isExpanded && (
          <div className="flex items-center p-4 h-full">
            {/* Album Art */}
            <div className="flex-shrink-0 mr-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow">
                {guide.image_url ? (
                  <img 
                    src={guide.image_url} 
                    alt={guide.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Play className="w-6 h-6 text-primary-foreground" />
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0 mr-4">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {guide.title}
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                {sections.length > 0 ? `${sections.length} chapters` : 'Audio Guide'}
              </p>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSkip(-15)}
                className="h-10 w-10 touch-manipulation"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={handlePlayPause}
                disabled={loading}
                size="icon"
                className="h-10 w-10 bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow touch-manipulation"
              >
                {loading ? (
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSkip(15)}
                className="h-10 w-10 touch-manipulation"
              >
                <SkipForward className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(true)}
                className="h-10 w-10 touch-manipulation"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Expanded Player */}
        {isExpanded && (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="touch-manipulation"
              >
                <ChevronDown className="w-5 h-5" />
              </Button>
              
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground">Playing from</p>
                <p className="text-sm font-semibold text-foreground">{guide.title}</p>
              </div>

              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="touch-manipulation">
                  <Share className="w-5 h-5" />
                </Button>
                {onClose && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={onClose}
                    className="touch-manipulation"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col p-6 space-y-6">
              {/* Album Art */}
              <div className="flex justify-center">
                <div className="w-64 h-64 bg-gradient-primary rounded-2xl shadow-tourism flex items-center justify-center">
                  {guide.image_url ? (
                    <img 
                      src={guide.image_url} 
                      alt={guide.title}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <Play className="w-24 h-24 text-primary-foreground" />
                  )}
                </div>
              </div>

              {/* Track Info */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {currentSectionData?.title || guide.title}
                </h1>
                <p className="text-lg text-muted-foreground">
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
              <div className="flex items-center justify-center gap-6">
                <Button variant="ghost" size="icon" className="touch-manipulation">
                  <Shuffle className="w-5 h-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePreviousSection}
                  disabled={hookCurrentSection === 0}
                  className="h-12 w-12 touch-manipulation"
                >
                  <SkipBack className="w-6 h-6" />
                </Button>

                <Button
                  onClick={handlePlayPause}
                  disabled={loading}
                  size="lg"
                  className="h-16 w-16 bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow touch-manipulation rounded-full"
                >
                  {loading ? (
                    <div className="w-8 h-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextSection}
                  disabled={hookCurrentSection >= sections.length - 1}
                  className="h-12 w-12 touch-manipulation"
                >
                  <SkipForward className="w-6 h-6" />
                </Button>

                <Button variant="ghost" size="icon" className="touch-manipulation">
                  <Repeat className="w-5 h-5" />
                </Button>
              </div>

              {/* Secondary Controls */}
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

              {/* Playlist */}
              {sections.length > 0 && (
                <div className="flex-1 min-h-0">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">Chapters</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {sections.map((section, index) => (
                      <div
                        key={section.id}
                        onClick={() => handlePlaySection(index)}
                        className={cn(
                          "flex items-center p-3 rounded-lg cursor-pointer transition-all touch-manipulation",
                          index === hookCurrentSection 
                            ? "bg-primary/10 border border-primary/20" 
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="w-8 h-8 flex items-center justify-center mr-3">
                          {index === hookCurrentSection && isPlaying ? (
                            <div className="w-4 h-4 bg-primary rounded-full animate-pulse" />
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {section.title}
                          </p>
                          {section.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {section.description}
                            </p>
                          )}
                        </div>
                        
                        {section.duration_seconds && (
                          <span className="text-sm text-muted-foreground ml-2">
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