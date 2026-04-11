import { Play, Pause, Loader2, Headphones } from "lucide-react";
import { useInvisibleAudioPlayer } from "@/hooks/useInvisibleAudioPlayer";

interface ChapterPreviewButtonProps {
  chapter: any;
  index: number;
  guide: any;
  isPurchased: boolean;
  selectedLanguage?: string;
}

export const ChapterPreviewButton = ({ chapter, index, guide, isPurchased, selectedLanguage }: ChapterPreviewButtonProps) => {
  const chapterAudioSrc = chapter.audio_url || guide?.audio_url;

  const audioPlayer = useInvisibleAudioPlayer({
    guideId: guide?.id,
    audioSrc: chapterAudioSrc,
    title: `${guide?.title} - ${chapter.title}`,
    isPreview: !isPurchased,
    chapterTimestamp: chapter.timestamp || chapter.start_time
  });

  const handlePlayPause = () => {
    if (audioPlayer.isPlaying) {
      audioPlayer.stop();
    } else {
      audioPlayer.play();
    }
  };

  return (
    <button
      onClick={handlePlayPause}
      disabled={audioPlayer.loading}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
        audioPlayer.isPlaying
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'bg-primary/10 text-primary hover:bg-primary/20'
      }`}
    >
      {audioPlayer.loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : audioPlayer.isPlaying ? (
        <Pause className="w-3.5 h-3.5" fill="currentColor" />
      ) : (
        <Headphones className="w-3.5 h-3.5" />
      )}
      <span>{audioPlayer.isPlaying ? 'Playing' : audioPlayer.loading ? '' : '30s'}</span>
    </button>
  );
};
