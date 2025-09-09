import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, ChevronRight } from 'lucide-react';

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
  onPlaySection: (index: number) => void;
}

export const ChapterList: React.FC<ChapterListProps> = ({
  sections,
  currentSectionIndex,
  isPlaying,
  loading,
  onPlaySection
}) => {
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Audio Chapters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sections.map((section, index) => (
            <button
              key={index}
              onClick={() => onPlaySection(index)}
              disabled={loading}
              className={`w-full flex items-center justify-between p-4 rounded-lg transition-all duration-200 touch-manipulation ${
                index === currentSectionIndex
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'bg-muted/30 hover:bg-muted/50 active:bg-muted/70'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  index === currentSectionIndex
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/10 text-primary'
                }`}>
                  {index === currentSectionIndex && isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};