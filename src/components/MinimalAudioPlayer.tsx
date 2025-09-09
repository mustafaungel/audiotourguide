import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import { MobileVolumeHelper } from '@/components/MobileVolumeHelper';
import { useIsMobile } from '@/hooks/use-mobile';

interface MinimalAudioPlayerProps {
  currentSection: {
    title: string;
    description?: string;
  };
  isPlaying: boolean;
  loading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  currentSectionIndex: number;
  totalSections: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  showVolumeHelper: boolean;
  onTogglePlayPause: () => void;
  onSeek: (progress: number[]) => void;
  onSkip: (seconds: number) => void;
  onPreviousSection: () => void;
  onNextSection: () => void;
  onVolumeChange: (volume: number[]) => void;
  onToggleMute: () => void;
  onSpeedChange: (speed: number) => void;
  onClose: () => void;
  onDismissVolumeHelper: () => void;
}

export const MinimalAudioPlayer: React.FC<MinimalAudioPlayerProps> = ({
  currentSection,
  isPlaying,
  loading,
  currentTime,
  duration,
  volume,
  isMuted,
  playbackSpeed,
  currentSectionIndex,
  totalSections,
  canGoNext,
  canGoPrevious,
  showVolumeHelper,
  onTogglePlayPause,
  onSeek,
  onSkip,
  onPreviousSection,
  onNextSection,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
  onClose,
  onDismissVolumeHelper
}) => {
  const isMobile = useIsMobile();

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-2 md:left-8 md:right-8">
      <CardContent className="p-4">
        {/* Mobile Volume Helper */}
        <MobileVolumeHelper 
          show={showVolumeHelper} 
          onDismiss={onDismissVolumeHelper}
        />

        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-sm line-clamp-1">{currentSection.title}</h4>
            <p className="text-xs text-muted-foreground">
              Chapter {currentSectionIndex + 1} of {totalSections}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 touch-manipulation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 mb-4">
          <Slider
            value={[progress]}
            onValueChange={onSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-between">
          {/* Skip Back */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip(-15)}
            disabled={loading}
            className="h-10 w-10 touch-manipulation"
            title="Skip back 15s"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {/* Previous Chapter */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousSection}
            disabled={loading || !canGoPrevious}
            className="h-10 w-10 touch-manipulation"
            title="Previous chapter"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          {/* Play/Pause */}
          <Button
            onClick={onTogglePlayPause}
            disabled={loading}
            size="lg"
            className="h-12 w-12 touch-manipulation rounded-full bg-gradient-primary hover:bg-gradient-primary/90"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          {/* Next Chapter */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextSection}
            disabled={loading || !canGoNext}
            className="h-10 w-10 touch-manipulation"
            title="Next chapter"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Skip Forward */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onSkip(15)}
            disabled={loading}
            className="h-10 w-10 touch-manipulation"
            title="Skip forward 15s"
          >
            <SkipForward className="h-4 w-4" />
          </Button>

          {/* Speed Control */}
          <div className="flex items-center gap-1">
            {[0.5, 1, 1.5, 2].map((speed) => (
              <Button
                key={speed}
                variant={playbackSpeed === speed ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onSpeedChange(speed)}
                className="h-8 w-10 text-xs touch-manipulation"
              >
                {speed}x
              </Button>
            ))}
          </div>

          {/* Volume Control - Desktop Only */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleMute}
                className="h-10 w-10 touch-manipulation"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[volume * 100]}
                  onValueChange={onVolumeChange}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};