import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";
import { useInvisibleAudioPlayer } from "@/hooks/useInvisibleAudioPlayer";

interface ChapterPreviewButtonProps {
  chapter: any;
  index: number;
  guide: any;
  isPurchased: boolean;
}

export const ChapterPreviewButton = ({ chapter, index, guide, isPurchased }: ChapterPreviewButtonProps) => {
  const audioPlayer = useInvisibleAudioPlayer({
    guideId: guide?.id,
    audioSrc: guide?.audio_url,
    title: `${guide?.title} - ${chapter.title}`,
    isPreview: !isPurchased
  });

  const handlePlayPause = () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.stop();
    } else {
      audioPlayer.play();
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline"
      onClick={handlePlayPause}
      disabled={audioPlayer.loading}
      className="min-w-[100px]"
    >
      {audioPlayer.isPlaying ? (
        <>
          <Square className="w-3 h-3 mr-1" />
          Stop
        </>
      ) : (
        <>
          <Play className="w-3 h-3 mr-1" />
          {audioPlayer.loading ? 'Loading...' : '30s Preview'}
        </>
      )}
    </Button>
  );
};