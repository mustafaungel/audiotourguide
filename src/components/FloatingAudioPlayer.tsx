import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, SkipForward, SkipBack, X, ChevronUp } from 'lucide-react';

interface FloatingAudioPlayerProps {
  title: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  progress: number;
  onPlayPause: () => void;
  onSkip: (seconds: number) => void;
  onSeek: (progress: number[]) => void;
  onClose: () => void;
  onExpand?: () => void;
  loading?: boolean;
}

export const FloatingAudioPlayer: React.FC<FloatingAudioPlayerProps> = ({
  title,
  isPlaying,
  currentTime,
  duration,
  progress,
  onPlayPause,
  onSkip,
  onSeek,
  onClose,
  onExpand,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (onExpand) onExpand();
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 shadow-lg bg-gradient-card border border-border/50">
      <CardContent className="p-3">
        {/* Collapsed View */}
        {!isExpanded ? (
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <Button
              onClick={onPlayPause}
              disabled={loading}
              size="icon"
              className="h-10 w-10 min-h-[40px] touch-manipulation rounded-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-md"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-foreground">{title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[progress]}
                  onValueChange={onSeek}
                  max={100}
                  step={0.1}
                  className="flex-1 h-1 touch-manipulation"
                />
                <span className="text-xs text-muted-foreground">
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>

            {/* Expand/Close Buttons */}
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpanded}
                className="h-8 w-8 p-0 touch-manipulation"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 p-0 touch-manipulation"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* Expanded View */
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium truncate text-foreground">{title}</p>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleExpanded}
                  className="h-8 w-8 p-0 touch-manipulation"
                >
                  <ChevronUp className="h-4 w-4 rotate-180" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 p-0 touch-manipulation"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[progress]}
                onValueChange={onSeek}
                max={100}
                step={0.1}
                className="w-full h-2 touch-manipulation"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              {/* Skip Back */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSkip(-15)}
                  disabled={loading}
                  className="h-10 w-10 min-h-[40px] touch-manipulation rounded-full"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">15s</span>
              </div>

              {/* Play/Pause */}
              <Button
                onClick={onPlayPause}
                disabled={loading}
                size="lg"
                className="h-12 w-12 min-h-[48px] touch-manipulation rounded-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-lg mx-2"
              >
                {loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>

              {/* Skip Forward */}
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSkip(15)}
                  disabled={loading}
                  className="h-10 w-10 min-h-[40px] touch-manipulation rounded-full"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">15s</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};