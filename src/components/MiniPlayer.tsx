import React from 'react';
import { Play, Pause, ChevronUp, SkipBack, SkipForward } from 'lucide-react';
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
}

const SPEED_OPTIONS = [1, 1.5, 2];

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
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
      {/* Progress bar on top edge */}
      <div className="h-[3px] bg-muted/30 w-full">
        <div
          className="h-full bg-gradient-to-r from-primary/70 via-primary to-primary/80"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className="bg-background/95 border-t border-border/30 px-4 py-3.5 shadow-[0_-4px_20px_-4px_hsl(var(--primary)/0.15)]"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-play-btn]')) return;
          haptics.light();
          onExpand();
        }}
      >
        <div className="flex items-center gap-2">
          {/* Album art thumbnail */}
          {imageUrl && (
            <img
              src={imageUrl}
              alt=""
              className="w-14 h-14 rounded-xl object-cover shadow-md ring-1 ring-border/20 shrink-0"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-foreground truncate">{title}</p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>

          {/* Skip Back */}
          {onSkipBack && (
            <button
              data-play-btn
              onClick={(e) => {
                e.stopPropagation();
                haptics.light();
                onSkipBack();
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-muted-foreground active:scale-90 active:bg-muted/60 transition-all"
            >
              <SkipBack className="w-5 h-5" fill="currentColor" />
            </button>
          )}

          {/* Play/Pause */}
          <button
            data-play-btn
            onClick={(e) => {
              e.stopPropagation();
              haptics.medium();
              onTogglePlay();
            }}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-90",
              "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
            )}
            disabled={loading}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" fill="currentColor" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
            )}
          </button>

          {/* Skip Forward */}
          {onSkipForward && (
            <button
              data-play-btn
              onClick={(e) => {
                e.stopPropagation();
                haptics.light();
                onSkipForward();
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-muted-foreground active:scale-90 active:bg-muted/60 transition-all"
            >
              <SkipForward className="w-5 h-5" fill="currentColor" />
            </button>
          )}

          {/* Speed toggle */}
          {onSpeedChange && (
            <button
              data-play-btn
              onClick={(e) => {
                e.stopPropagation();
                cycleSpeed();
              }}
              className="h-7 px-1.5 rounded-md flex items-center justify-center shrink-0 text-xs font-semibold text-muted-foreground bg-muted/50 active:scale-90 transition-transform tabular-nums"
            >
              {playbackSpeed}x
            </button>
          )}

          {/* Expand arrow */}
          <button
            data-play-btn
            onClick={(e) => {
              e.stopPropagation();
              haptics.light();
              onExpand();
            }}
            className="w-10 h-10 flex items-center justify-center text-muted-foreground shrink-0"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
