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
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium truncate">{guide.title}</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-1">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => skip(-10)}
            disabled={loading}
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={handlePlayPause}
            disabled={loading}
            size="sm"
            className="h-10 w-10"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => skip(10)}
            disabled={loading}
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMute}
            className="p-1"
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
            className="flex-1"
          />
        </div>
      </CardContent>
    </Card>
  );
};