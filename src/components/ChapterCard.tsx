import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Lock } from 'lucide-react';
import { AudioPreviewPlayer } from './AudioPreviewPlayer';

interface ChapterCardProps {
  chapter: {
    title: string;
    duration?: number;
    duration_seconds?: number;
  };
  index: number;
  isPurchased: boolean;
  guideId: string;
  audioUrl?: string;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({
  chapter,
  index,
  isPurchased,
  guideId,
  audioUrl
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDuration = () => {
    if (chapter.duration_seconds) return chapter.duration_seconds;
    if (chapter.duration) return chapter.duration * 60; // Convert minutes to seconds
    return 0;
  };

  const handlePlayClick = () => {
    if (isPurchased) {
      // Full access - play the full chapter
      setShowPreview(true);
    } else {
      // Preview mode - 30 second preview
      setShowPreview(true);
    }
  };

  return (
    <>
      <Card className="p-4 hover:bg-muted/50 cursor-pointer transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <div>
              <h4 className="font-medium">{chapter.title}</h4>
              <p className="text-sm text-muted-foreground">
                {formatDuration(getDuration())}
                {!isPurchased && " • Preview available"}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handlePlayClick}
            disabled={!audioUrl}
          >
            {isPurchased ? (
              <Play className="w-4 h-4" />
            ) : (
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4" />
                <span className="text-xs">30s</span>
              </div>
            )}
          </Button>
        </div>
      </Card>

      {showPreview && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t">
          <div className="container mx-auto">
            <AudioPreviewPlayer 
              title={`${chapter.title} ${isPurchased ? '' : '(Preview)'}`}
              guideId={guideId}
              audioSrc={audioUrl}
              onClose={() => setShowPreview(false)}
              isPreview={!isPurchased}
            />
          </div>
        </div>
      )}
    </>
  );
};