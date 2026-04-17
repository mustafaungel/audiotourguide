import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Headphones, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { BottomSheet } from './ui/bottom-sheet';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { t } from '@/lib/translations';
import { openMapsLink } from '@/lib/maps-utils';

interface Section {
  id: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
  maps_url?: string | null;
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
      <Card className={cn("audio-card-glow border-border/30 bg-card/50 shadow-[0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)]", className?.includes('in-sheet') && "border-0 shadow-none bg-transparent", className)}>
        <CardHeader className="pb-4 space-y-1.5">
          <div className="flex flex-row items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Headphones className="w-4 h-4 text-primary" />
            {t('listenBelow', lang)}
          </span>
          
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
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5 px-4 pb-4">
        {sections.map((section, index) => {
          const isCurrent = index === currentSectionIndex;

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
                "w-full text-left rounded-xl p-3 transition-all min-h-[64px] touch-manipulation group/chapter",
                "hover:bg-primary/5 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] active:scale-[0.96] active:bg-primary/20 active:shadow-inner",
                isCurrent 
                  ? "bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/50 border-l-primary shadow-[0_4px_16px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)] shadow-primary/20" 
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

                {/* Chapter Number Badge OR Maps Pin */}
                <div className="flex-shrink-0">
                  {section.maps_url ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.medium();
                        openMapsLink(section.maps_url);
                      }}
                      aria-label="Open this location in Google Maps"
                      title="Open in Google Maps"
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center relative",
                        "transition-all duration-200 active:scale-95 hover:scale-110",
                        "bg-gradient-to-br from-red-500 to-red-600 text-white",
                        "shadow-[0_4px_12px_rgba(239,68,68,0.45)] hover:shadow-[0_6px_18px_rgba(239,68,68,0.6)]"
                      )}
                    >
                      <MapPin className="w-4 h-4" fill="currentColor" strokeWidth={2} />
                      {isCurrent && isPlaying && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background flex items-center justify-center">
                          <Pause className="w-1.5 h-1.5 text-primary-foreground" fill="currentColor" />
                        </span>
                      )}
                    </button>
                  ) : (
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
                  )}
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
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {(() => {
                        const clean = section.description
                          .replace(/^\*"/g, '').replace(/^Description\s*\*?/i, '')
                          .replace(/^[–—]\s*/g, '').replace(/^[""\s]+/g, '').trim();
                        return clean.length > 150 ? clean.substring(0, 150) + '...' : clean;
                      })()}
                    </p>
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
