import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BottomSheet } from './ui/bottom-sheet';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
}

interface ChapterListProps {
  sections: Section[];
  currentSectionIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlaySection: (index: number) => void;
  onTogglePlay?: () => void;
  className?: string;
  // Optional props for backward compatibility with NewSectionAudioPlayer
  loading?: boolean;
  volume?: number;
  isMuted?: boolean;
  playbackSpeed?: number;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  autoAdvanceEnabled?: boolean;
  isChapterCompleted?: (chapterIndex: number) => boolean;
  onTogglePlayPause?: () => void;
  onSeek?: (newProgress: number[]) => void;
  onSkip?: (seconds: number) => void;
  onPreviousSection?: () => void;
  onNextSection?: () => void;
  onToggleMute?: () => void;
  onVolumeChange?: (newVolume: number[]) => void;
  onSpeedChange?: (speed: number) => void;
  onAutoAdvanceChange?: (enabled: boolean) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  sections,
  currentSectionIndex,
  isPlaying,
  currentTime,
  duration,
  onPlaySection,
  onTogglePlay,
  onTogglePlayPause,
  onSkip,
  onPreviousSection,
  onNextSection,
  onSpeedChange,
  playbackSpeed = 1.0,
  canGoNext = true,
  canGoPrevious = true,
  className,
}) => {
  const [showSpeedSheet, setShowSpeedSheet] = useState(false);
  
  // Use onTogglePlayPause if provided, otherwise use onTogglePlay
  const handleToggle = onTogglePlayPause || onTogglePlay || (() => {});
  
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const handleSpeedChange = (speed: number) => {
    haptics.selection();
    onSpeedChange?.(speed);
    setTimeout(() => setShowSpeedSheet(false), 200);
  };

  if (!sections || sections.length === 0) return null;

  return (
    <>
      <Card className={cn("bg-card/50 border-border/50", className)}>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-semibold">Up Next</CardTitle>
          
          {/* Playback Controls */}
          {currentSectionIndex >= 0 && (
            <div className="flex items-center gap-1">
              {/* Previous */}
              {onPreviousSection && sections.length > 1 && (
                <Button
                  onClick={() => {
                    haptics.light();
                    onPreviousSection();
                  }}
                  disabled={!canGoPrevious}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Previous section"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Skip -15s */}
              {onSkip && (
                <Button
                  onClick={() => {
                    haptics.light();
                    onSkip(-15);
                  }}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Skip back 15 seconds"
                >
                  <span className="text-[9px] font-semibold">-15</span>
                </Button>
              )}

              {/* Skip +15s */}
              {onSkip && (
                <Button
                  onClick={() => {
                    haptics.light();
                    onSkip(15);
                  }}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Skip forward 15 seconds"
                >
                  <span className="text-[9px] font-semibold">+15</span>
                </Button>
              )}

              {/* Next */}
              {onNextSection && sections.length > 1 && (
                <Button
                  onClick={() => {
                    haptics.light();
                    onNextSection();
                  }}
                  disabled={!canGoNext}
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="Next section"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </Button>
              )}

              {/* Speed */}
              {onSpeedChange && (
                <Button
                  onClick={() => {
                    haptics.medium();
                    setShowSpeedSheet(true);
                  }}
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 bg-muted/50 hover:bg-muted"
                  aria-label="Change playback speed"
                >
                  <span className="text-[10px] font-bold">{playbackSpeed}×</span>
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-2 px-3 pb-3">
        {sections.map((section, index) => {
          const isCurrent = index === currentSectionIndex;
          const progress = isCurrent ? (currentTime / duration) * 100 : 0;

          return (
            <button
              key={section.id}
              onClick={() => {
                haptics.selection();
                if (isCurrent) {
                  handleToggle();
                } else {
                  onPlaySection(index);
                }
              }}
              className={cn(
                "w-full text-left rounded-xl p-3 transition-all",
                "hover:bg-muted/50 active:scale-[0.98]",
                isCurrent ? "bg-primary/10 border border-primary/20" : "bg-card/30"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Play/Pause Button */}
                <div className="mt-0.5">
                  {isCurrent && isPlaying ? (
                    <Pause className="w-4 h-4 text-primary" fill="currentColor" />
                  ) : (
                    <Play className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                {/* Chapter Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={cn(
                      "font-medium text-sm truncate",
                      isCurrent ? "text-primary" : "text-foreground"
                    )}>
                      {section.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(section.duration_seconds || 0)}
                    </span>
                  </div>
                  
                  {section.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                      {section.description}
                    </p>
                  )}

                  {/* Progress Bar for Current Chapter */}
                  {isCurrent && (
                    <div className="mt-2">
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
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
                  )}
                </div>
              </div>
            </button>
          );
        })}
        </CardContent>
      </Card>

      {/* Speed Control Bottom Sheet */}
      {onSpeedChange && (
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
                      onClick={() => handleSpeedChange(speed)}
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
      )}
    </>
  );
};
