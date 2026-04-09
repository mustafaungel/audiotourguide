import React from 'react';
import { Play, Pause, ChevronUp, SkipBack, SkipForward, Headphones, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

interface MiniPlayerProps {
  title: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  loading?: boolean;
  imageUrl?: string;
  variant?: 'fixed' | 'inline';
  playbackSpeed?: number;
  onTogglePlay: () => void;
  onExpand: () => void;
  onSkipBack?: () => void;
  onSkipForward?: () => void;
  onSpeedChange?: (speed: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

const SPEED_OPTIONS = [1, 1.5, 2];

export const MiniPlayer = React.memo<MiniPlayerProps>(({
  title,
  currentTime,
  duration,
  isPlaying,
  loading,
  imageUrl,
  onTogglePlay,
  onExpand,
  onSkipBack,
  onSkipForward,
  onSpeedChange,
  onPrevious,
  onNext,
  playbackSpeed = 1,
  variant = 'fixed',
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cycleSpeed = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
    const nextSpeed = SPEED_OPTIONS[(currentIndex + 1) % SPEED_OPTIONS.length];
    onSpeedChange?.(nextSpeed);
    haptics.light();
  };

  return (
    <div className={cn(
      variant === 'fixed'
        ? "fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
        : "w-full z-10"
    )}>
      <div
        className="bg-background/95 backdrop-blur-lg border-t border-border/30 shadow-[0_-4px_24px_-4px_hsl(var(--primary)/0.2)]"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-play-btn]')) return;
          haptics.light();
          onExpand();
        }}
      >
        {/* Row 1: Now Playing title + time + expand */}
        <div className="flex items-center gap-2 px-4 pt-2.5 pb-1">
          <Headphones className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-sm font-semibold text-foreground truncate flex-1">{title}</p>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <button
            data-play-btn
            onClick={(e) => { e.stopPropagation(); haptics.light(); onExpand(); }}
            className="w-8 h-8 flex items-center justify-center text-muted-foreground shrink-0"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>

        {/* Row 2: Album art + controls */}
        <div className="flex items-center gap-1.5 px-4 pb-2">
          {/* Album art */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="w-11 h-11 rounded-lg object-cover shadow-md ring-1 ring-border/20 shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}

          {/* Controls - centered, always same layout */}
          <div className="flex-1 flex items-center justify-center gap-0.5">
            {/* Previous section - always visible, disabled when at first */}
            <button data-play-btn disabled={!onPrevious}
              onClick={(e) => { e.stopPropagation(); if (onPrevious) { haptics.light(); onPrevious(); } }}
              className={cn("w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all", onPrevious ? "text-muted-foreground" : "text-muted-foreground/20")}>
              <SkipBack className="w-4 h-4" fill="currentColor" />
            </button>

            {/* Skip -15s */}
            <button data-play-btn
              onClick={(e) => { e.stopPropagation(); haptics.light(); onSkipBack?.(); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground/50 active:scale-90 transition-all">
              <span className="text-[10px] font-bold">-15</span>
            </button>

            {/* Play/Pause */}
            <button data-play-btn onClick={(e) => { e.stopPropagation(); haptics.medium(); onTogglePlay(); }}
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90 bg-primary text-primary-foreground shadow-lg shadow-primary/25"
              disabled={loading}>
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5 ml-0.5" fill="currentColor" />}
            </button>

            {/* Skip +15s */}
            <button data-play-btn
              onClick={(e) => { e.stopPropagation(); haptics.light(); onSkipForward?.(); }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground/50 active:scale-90 transition-all">
              <span className="text-[10px] font-bold">+15</span>
            </button>

            {/* Next section - always visible, disabled when at last */}
            <button data-play-btn disabled={!onNext}
              onClick={(e) => { e.stopPropagation(); if (onNext) { haptics.light(); onNext(); } }}
              className={cn("w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all", onNext ? "text-muted-foreground" : "text-muted-foreground/20")}>
              <SkipForward className="w-4 h-4" fill="currentColor" />
            </button>
          </div>

          {/* Speed */}
          {onSpeedChange && (
            <button data-play-btn onClick={(e) => { e.stopPropagation(); cycleSpeed(); }}
              className="h-7 px-2 rounded-md flex items-center justify-center shrink-0 text-[10px] font-bold text-muted-foreground bg-muted/50 active:scale-90 transition-transform tabular-nums">
              {playbackSpeed}x
            </button>
          )}
        </div>

        {/* Progress bar at bottom */}
        <div className="h-[4px] bg-muted/30 w-full">
          <div
            className="h-full bg-gradient-to-r from-primary/70 via-primary to-primary/80 transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
});

MiniPlayer.displayName = 'MiniPlayer';
