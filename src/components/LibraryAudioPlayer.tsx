import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack } from 'lucide-react';
import { useLibraryAudio } from '@/hooks/useLibraryAudio';

interface LibraryAudioPlayerProps {
  guide: {
    id: string;
    title: string;
    audio_url?: string;
  };
  accessCode?: string;
  onClose?: () => void;
}

export const LibraryAudioPlayer: React.FC<LibraryAudioPlayerProps> = ({
  guide,
  accessCode,
  onClose
}) => {
  const [isMuted, setIsMuted] = useState(false);
  
  const {
    isPlaying,
    loading,
    currentTime,
    duration,
    volume,
    play,
    pause,
    stop,
    seek,
    setVolume,
    cleanup
  } = useLibraryAudio({
    guideId: guide.id,
    accessCode,
    title: guide.title
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0] / 100;
    setVolume(vol);
    setIsMuted(vol === 0);
  };

  const handleMute = () => {
    if (isMuted) {
      setVolume(0.5);
      setIsMuted(false);
    } else {
      setVolume(0);
      setIsMuted(true);
    }
  };

  const handleSeek = (newProgress: number[]) => {
    const newTime = (newProgress[0] / 100) * duration;
    seek(newTime);
  };

  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seek(newTime);
  };

  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-50 shadow-tourism bg-gradient-card border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold truncate text-foreground">{guide.title}</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 touch-manipulation">
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full h-2 touch-manipulation"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(-15)}
            disabled={loading}
            className="h-12 w-12 min-h-[48px] touch-manipulation rounded-full"
            title="Skip back 15 seconds"
          >
            <SkipBack className="h-5 w-5" />
          </Button>
          
          <Button
            onClick={handlePlayPause}
            disabled={loading}
            size="lg"
            className="h-14 w-14 min-h-[56px] touch-manipulation rounded-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-lg"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(15)}
            disabled={loading}
            className="h-12 w-12 min-h-[48px] touch-manipulation rounded-full"
            title="Skip forward 15 seconds"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMute}
            className="h-10 w-10 min-h-[40px] touch-manipulation flex-shrink-0"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[volume * 100]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
            className="flex-1 h-2 touch-manipulation"
          />
        </div>
      </CardContent>
    </Card>
  );
};