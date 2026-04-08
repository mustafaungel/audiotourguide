import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Headphones } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BottomSheet } from './ui/bottom-sheet';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';

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
  hideMobileControls?: boolean;
  lang?: string;
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
  hideMobileControls = false,
  className,
  lang = 'en',
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
      <Card className={cn("audio-card-glow border-border/30 bg-card/50", className?.includes('in-sheet') && "border-0 shadow-none bg-transparent", className)}>
        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Headphones className="w-4 h-4 text-primary" />
            {t('upNext', lang)}
          </CardTitle>
          
          {/* Playback Controls — hidden on mobile when mini player is active */}
          {currentSectionIndex >= 0 && !hideMobileControls && (
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
        <CardContent className="space-y-3 px-4 pb-4">
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
                "w-full text-left rounded-xl p-4 transition-all min-h-[72px] touch-manipulation group/chapter",
                "hover:bg-primary/5 active:scale-[0.97]",
                isCurrent 
                  ? "bg-primary/10 border-2 border-primary/50 border-l-primary shadow-lg shadow-primary/20" 
                  : "bg-card/30 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Mini Waveform Decoration */}
                <div className="flex items-center gap-0.5 opacity-30 group-hover/chapter:opacity-60 transition-opacity">
                  <div className="w-[2px] h-2 bg-primary rounded-full" style={{ animationDelay: '0s' }} />
                  <div className="w-[2px] h-3 bg-primary rounded-full" style={{ animationDelay: '0.15s' }} />
                  <div className="w-[2px] h-1.5 bg-primary rounded-full" style={{ animationDelay: '0.3s' }} />
                </div>

                {/* Chapter Number Badge */}
                <div className="flex-shrink-0">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold",
                    isCurrent 
                      ? "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground" 
                      : "bg-primary/10 text-muted-foreground"
                  )}>
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4" fill="currentColor" />
                    ) : isCurrent ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                </div>

                {/* Chapter Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={cn(
                      "font-medium text-sm truncate",
                      isCurrent ? "text-primary font-semibold" : "text-foreground"
                    )}>
                      {section.title}
                    </h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap font-medium tabular-nums shrink-0 bg-primary/10 rounded-full px-2 py-0.5">
                      {formatTime(section.duration_seconds || 0)}
                    </span>
                  </div>
                  
                  {section.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {section.description}
                    </p>
                  )}

                  {/* Progress Bar for Current Chapter — Spotify Style */}
                  {isCurrent && (
                    <div className="mt-3">
                      <div className="relative h-1 bg-muted rounded-full overflow-visible">
                        <div
                          className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/80 rounded-full transition-all duration-300 shadow-sm shadow-primary/30"
                          style={{ width: `${progress}%` }}
                        />
                        {/* Scrubber Dot */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full shadow-md shadow-primary/40 transition-all duration-300"
                          style={{ left: `calc(${progress}% - 5px)` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1.5">
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatTime(currentTime)}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
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
          title={t('playbackSpeed', lang)}
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
                        {speed === 1.0 ? t('normal', lang) : `${speed}×`}
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
