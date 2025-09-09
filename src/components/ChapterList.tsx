import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Play, Pause, ChevronRight, ChevronLeft, Volume2, VolumeX, Check, Settings } from 'lucide-react';
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
  autoAdvanceEnabled?: boolean;
  isChapterCompleted?: (index: number) => boolean;
  onPlaySection: (index: number) => void;
  onTogglePlayPause?: () => void;
  onSeek?: (progress: number[]) => void;
  onSkip?: (seconds: number) => void;
  onPreviousSection?: () => void;
  onNextSection?: () => void;
  onToggleMute?: () => void;
  onVolumeChange?: (volume: number[]) => void;
  onSpeedChange?: (speed: number) => void;
  onAutoAdvanceChange?: (enabled: boolean) => void;
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
  autoAdvanceEnabled = false,
  isChapterCompleted = () => false,
  onPlaySection,
  onTogglePlayPause,
  onSeek,
  onSkip,
  onPreviousSection,
  onNextSection,
  onToggleMute,
  onVolumeChange,
  onSpeedChange,
  onAutoAdvanceChange
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Audio Chapters</CardTitle>
          {/* Chapter progress info */}
          <div className="text-sm text-muted-foreground">
            {sections.length} chapters
          </div>
        </div>
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium relative ${
                    index === currentSectionIndex
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {index === currentSectionIndex && isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {/* Completion indicator */}
                    {isChapterCompleted(index) && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
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
                      <div className="flex items-center justify-center gap-8">
                        {/* Previous Chapter */}
                        <div className="flex flex-col items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={onPreviousSection}
                            disabled={loading || !canGoPrevious}
                            className="h-12 w-12 touch-manipulation"
                            title="Previous chapter"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </Button>
                          <span className="text-xs text-muted-foreground font-medium">Prev</span>
                        </div>

                        {/* Play/Pause */}
                        <Button
                          onClick={onTogglePlayPause}
                          disabled={loading}
                          size="lg"
                          className="h-16 w-16 touch-manipulation rounded-full bg-gradient-primary hover:bg-gradient-primary/90"
                        >
                          {loading ? (
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : isPlaying ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6 ml-0.5" />
                          )}
                        </Button>

                        {/* Next Chapter */}
                        <div className="flex flex-col items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={onNextSection}
                            disabled={loading || !canGoNext}
                            className="h-12 w-12 touch-manipulation"
                            title="Next chapter"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </Button>
                          <span className="text-xs text-muted-foreground font-medium">Next</span>
                        </div>
                      </div>

                      {/* Secondary Controls Row */}
                      <div className="flex items-center justify-center gap-4">
                        {/* Speed Control - Compact Toggle */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const speeds = [0.75, 1, 1.25, 1.5, 2];
                            const currentIndex = speeds.indexOf(playbackSpeed);
                            const nextIndex = (currentIndex + 1) % speeds.length;
                            onSpeedChange?.(speeds[nextIndex]);
                          }}
                          className="h-10 px-4 touch-manipulation rounded-lg border border-muted"
                          title={`Speed: ${playbackSpeed}x (tap to change)`}
                        >
                          <span className="text-sm font-medium">{playbackSpeed}x</span>
                        </Button>
                      </div>

                      {/* Volume Controls Row - Mobile Only */}
                      <div className="flex items-center gap-3 px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onToggleMute}
                          className="h-10 w-10 touch-manipulation shrink-0"
                          title="Mute/Unmute"
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <Slider
                            value={[isMuted ? 0 : volume * 100]}
                            onValueChange={(value) => {
                              const newVolume = value[0] / 100;
                              if (newVolume > 0 && isMuted) {
                                // Auto-unmute when adjusting volume up
                                onToggleMute?.();
                              }
                              // Handle volume change via parent
                              const event = { target: { value: value[0] } };
                              onVolumeChange?.(value);
                            }}
                            max={100}
                            step={1}
                            className="w-full"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                          {Math.round((isMuted ? 0 : volume) * 100)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Desktop Layout: Centered Controls
                    <div className="flex items-center justify-center gap-6">
                      {/* Previous Chapter */}
                      <div className="flex flex-col items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onPreviousSection}
                          disabled={loading || !canGoPrevious}
                          className="h-12 w-12 touch-manipulation"
                          title="Previous chapter"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <span className="text-xs text-muted-foreground font-medium">Prev</span>
                      </div>

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
                      <div className="flex flex-col items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={onNextSection}
                          disabled={loading || !canGoNext}
                          className="h-12 w-12 touch-manipulation"
                          title="Next chapter"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                        <span className="text-xs text-muted-foreground font-medium">Next</span>
                      </div>

                      {/* Speed Control */}
                      <div className="flex items-center gap-1 ml-4">
                        {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                          <Button
                            key={speed}
                            variant={playbackSpeed === speed ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => onSpeedChange?.(speed)}
                            className="h-8 w-12 text-xs touch-manipulation"
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
                        className="h-10 w-10 touch-manipulation ml-2"
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