import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, ChevronUp, SkipBack, SkipForward, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

// Marquee component for long titles
const MarqueeText: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const check = () => {
      if (containerRef.current && innerRef.current) {
        const overflow = innerRef.current.scrollWidth > containerRef.current.clientWidth;
        setShouldScroll(overflow);
      }
    };
    // Check after mount, after layout, and on resize
    const t1 = setTimeout(check, 50);
    const t2 = setTimeout(check, 300);
    const t3 = setTimeout(check, 800);
    const observer = new ResizeObserver(check);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); observer.disconnect(); };
  }, [text]);

  return (
    <div ref={containerRef} className={cn("overflow-hidden", className)}>
      <div
        ref={innerRef}
        className={cn("whitespace-nowrap", shouldScroll && "animate-marquee inline-block")}
        style={shouldScroll ? { animationDuration: `${Math.max(10, text.length * 0.3)}s` } : undefined}
      >
        <span>{text}</span>
        {shouldScroll && <span className="mx-16 text-muted-foreground/20">•</span>}
        {shouldScroll && <span>{text}</span>}
      </div>
    </div>
  );
};

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
  autoAdvance?: boolean;
  onToggleAutoAdvance?: () => void;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

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
  autoAdvance,
  onToggleAutoAdvance,
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
          <MarqueeText text={title} className="text-sm font-semibold text-foreground flex-1" />
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

          {/* Speed + Auto */}
          <div className="flex items-center gap-1 shrink-0">
            {onSpeedChange && (
              <button data-play-btn onClick={(e) => { e.stopPropagation(); cycleSpeed(); }}
                className="h-8 min-w-[34px] px-2 rounded-lg flex items-center justify-center text-[11px] font-bold text-foreground bg-muted/60 border border-border/30 active:scale-90 active:bg-muted transition-all tabular-nums">
                {playbackSpeed}x
              </button>
            )}
            {onToggleAutoAdvance && (
              <button data-play-btn onClick={(e) => { e.stopPropagation(); haptics.medium(); onToggleAutoAdvance(); }}
                className={cn("h-8 w-8 rounded-lg flex items-center justify-center active:scale-90 transition-colors duration-200 border",
                  autoAdvance
                    ? "bg-green-500 text-white border-green-500 shadow-sm shadow-green-500/30"
                    : "bg-muted/60 text-muted-foreground/50 border-border/30")}>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M5 4l10 8-10 8V4zM17 4h2v16h-2V4z"/>
                </svg>
              </button>
            )}
          </div>
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
