import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DesktopPlayerBarProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  loading: boolean;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onTogglePlay: () => void;
  onSeek: (newProgress: number[]) => void;
  onSkip: (seconds: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onVolumeChange: (newVolume: number[]) => void;
  onToggleMute: () => void;
  onSpeedChange: (speed: number) => void;
}

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const DesktopPlayerBar: React.FC<DesktopPlayerBarProps> = ({
  title,
  subtitle,
  imageUrl,
  currentTime,
  duration,
  isPlaying,
  loading,
  volume,
  isMuted,
  playbackSpeed,
  canGoNext,
  canGoPrevious,
  onTogglePlay,
  onSeek,
  onSkip,
  onPrevious,
  onNext,
  onVolumeChange,
  onToggleMute,
  onSpeedChange,
}) => {
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-background/95 backdrop-blur-xl border-t border-border',
        'shadow-[0_-8px_32px_rgba(0,0,0,0.12)]',
        'transform-gpu'
      )}
      role="region"
      aria-label="Audio player"
    >
      <div className="max-w-7xl mx-auto px-6 py-3 grid grid-cols-[1fr_2fr_1fr] items-center gap-6">
        {/* Left: Cover + Title */}
        <div className="flex items-center gap-3 min-w-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="w-14 h-14 rounded-lg object-cover shadow-md flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Center: Controls + Progress */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={onPrevious}
              disabled={!canGoPrevious}
              className="h-9 w-9 rounded-full"
              aria-label="Previous chapter"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onSkip(-15)}
              className="h-9 w-9 rounded-full"
              aria-label="Skip back 15 seconds"
            >
              <span className="text-[10px] font-bold">-15</span>
            </Button>
            <Button
              onClick={onTogglePlay}
              disabled={loading}
              className="h-11 w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {loading ? (
                <span className="flex items-center gap-[2px]">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-[3px] h-3 rounded-full bg-current audio-wave-bar"
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  ))}
                </span>
              ) : isPlaying ? (
                <Pause className="h-5 w-5" fill="currentColor" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onSkip(15)}
              className="h-9 w-9 rounded-full"
              aria-label="Skip forward 15 seconds"
            >
              <span className="text-[10px] font-bold">+15</span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onNext}
              disabled={!canGoNext}
              className="h-9 w-9 rounded-full"
              aria-label="Next chapter"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-3 w-full">
            <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[progress]}
              onValueChange={onSeek}
              max={100}
              step={0.1}
              className="flex-1"
              aria-label="Seek"
            />
            <span className="text-[11px] text-muted-foreground tabular-nums w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right: Speed + Volume */}
        <div className="flex items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-9 px-3 gap-1.5"
                aria-label="Playback speed"
              >
                <Gauge className="h-4 w-4" />
                <span className="text-xs font-semibold tabular-nums">
                  {playbackSpeed}x
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {SPEED_OPTIONS.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={cn(playbackSpeed === s && 'font-bold text-primary')}
                >
                  {s}x{s === 1 && ' (Normal)'}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex items-center gap-2 w-32">
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleMute}
              className="h-9 w-9 rounded-full flex-shrink-0"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[volume * 100]}
              onValueChange={onVolumeChange}
              max={100}
              step={1}
              className="flex-1"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
