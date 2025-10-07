import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
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
  className,
  // Destructure optional props but don't use them in the simplified version
}) => {
  // Use onTogglePlayPause if provided, otherwise use onTogglePlay
  const handleToggle = onTogglePlayPause || onTogglePlay || (() => {});
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!sections || sections.length === 0) return null;

  return (
    <Card className={cn("bg-card/50 border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Up Next</CardTitle>
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
  );
};
