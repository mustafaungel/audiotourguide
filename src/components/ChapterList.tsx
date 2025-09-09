import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, ChevronRight, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Section {
  id?: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
  order_index?: number;
}

interface ChapterListProps {
  sections: Section[];
  currentSectionIndex: number;
  isPlaying: boolean;
  loading: boolean;
  currentTime?: number;
  duration?: number;
  volume?: number;
  isMuted?: boolean;
  playbackSpeed?: number;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  onPlaySection: (index: number) => void;
  onTogglePlayPause?: () => void;
  onSeek?: (progress: number[]) => void;
  onSkip?: (seconds: number) => void;
  onPreviousSection?: () => void;
  onNextSection?: () => void;
  onToggleMute?: () => void;
  onSpeedChange?: (speed: number) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  sections,
  currentSectionIndex,
  isPlaying,
  loading,
  currentTime = 0,
  duration = 0,
  volume = 1,
  isMuted = false,
  playbackSpeed = 1,
  canGoNext = false,
  canGoPrevious = false,
  onPlaySection,
  onTogglePlayPause,
  onSeek,
  onSkip,
  onPreviousSection,
  onNextSection,
  onToggleMute,
  onSpeedChange
}) => {
  const isMobile = useIsMobile();
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '1:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!sections.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No chapters available for this guide.</p>
        </CardContent>
      </Card>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Audio Chapters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sections.map((section, index) => (
            <div key={index}>
              {/* Chapter Button */}
              <button
                onClick={() => onPlaySection(index)}
                disabled={loading}
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200 touch-manipulation ${
                  index === currentSectionIndex
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                    : 'bg-muted/30 hover:bg-muted/50 active:bg-muted/70'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    index === currentSectionIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {index === currentSectionIndex && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-base">{section.title}</h4>
                    {section.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {section.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Chapter {index + 1} of {sections.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground font-medium">
                    {formatTime(section.duration_seconds)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>

              {/* Inline Audio Controls - Show only for active chapter */}
              {index === currentSectionIndex && currentSectionIndex >= 0 && (
                <div className="mt-3 p-4 bg-card border rounded-lg">
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <Slider
                      value={[progress]}
                      onValueChange={onSeek || (() => {})}
                      max={100}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Main Controls - Mobile Responsive Layout */}
                  {isMobile ? (
                    // Mobile Layout: Stacked Controls
                    <div className="space-y-3">
                      {/* Primary Controls Row */}
                      <div className="flex items-center justify-center gap-6">
                        {/* Previous Chapter */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onPreviousSection}
                          disabled={loading || !canGoPrevious}
                          className="h-12 w-12 touch-manipulation"
                          title="Previous chapter"
                        >
                          <SkipBack className="h-5 w-5" />
                        </Button>

                        {/* Play/Pause */}
                        <Button
                          onClick={onTogglePlayPause}
                          disabled={loading}
                          size="lg"
                          className="h-14 w-14 touch-manipulation rounded-full bg-gradient-primary hover:bg-gradient-primary/90"
                        >
                          {loading ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : isPlaying ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5 ml-0.5" />
                          )}
                        </Button>

                        {/* Next Chapter */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onNextSection}
                          disabled={loading || !canGoNext}
                          className="h-12 w-12 touch-manipulation"
                          title="Next chapter"
                        >
                          <SkipForward className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Secondary Controls Row */}
                      <div className="flex items-center justify-between">
                        {/* Skip Back */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSkip?.(-15)}
                          disabled={loading}
                          className="h-10 px-3 touch-manipulation"
                          title="Skip back 15s"
                        >
                          <SkipBack className="h-4 w-4 mr-1" />
                          <span className="text-xs">15s</span>
                        </Button>

                        {/* Speed Control - Compact Toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const speeds = [0.5, 1, 1.5, 2];
                            const currentIndex = speeds.indexOf(playbackSpeed);
                            const nextIndex = (currentIndex + 1) % speeds.length;
                            onSpeedChange?.(speeds[nextIndex]);
                          }}
                          className="h-10 px-3 touch-manipulation"
                          title={`Speed: ${playbackSpeed}x (tap to change)`}
                        >
                          <span className="text-xs font-medium">{playbackSpeed}x</span>
                        </Button>

                        {/* Mute Toggle */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onToggleMute}
                          className="h-10 w-10 touch-manipulation"
                          title="Mute/Unmute"
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Skip Forward */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSkip?.(15)}
                          disabled={loading}
                          className="h-10 px-3 touch-manipulation"
                          title="Skip forward 15s"
                        >
                          <span className="text-xs">15s</span>
                          <SkipForward className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Desktop Layout: Single Row
                    <div className="flex items-center justify-between">
                      {/* Skip Back */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSkip?.(-15)}
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
                        onClick={() => onSkip?.(15)}
                        disabled={loading}
                        className="h-10 w-10 touch-manipulation"
                        title="Skip forward 15s"
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>

                      {/* Speed Control - Full Buttons */}
                      <div className="flex items-center gap-1">
                        {[0.5, 1, 1.5, 2].map((speed) => (
                          <Button
                            key={speed}
                            variant={playbackSpeed === speed ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => onSpeedChange?.(speed)}
                            className="h-8 w-10 text-xs touch-manipulation"
                          >
                            {speed}x
                          </Button>
                        ))}
                      </div>

                      {/* Mute Toggle */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggleMute}
                        className="h-10 w-10 touch-manipulation"
                        title="Mute/Unmute"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};