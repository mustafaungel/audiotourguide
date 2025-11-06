import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, WifiOff } from 'lucide-react';
import { useLibraryAudio } from '@/hooks/useLibraryAudio';
import { Badge } from './ui/badge';

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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const {
    isPlaying,
    loading,
    currentTime,
    duration,
    volume,
    playbackSpeed: hookPlaybackSpeed,
    play,
    pause,
    stop,
    seek,
    setVolume,
    setSpeed,
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
    console.log('[LIBRARY-AUDIO] Volume change requested:', vol);
    setVolume(vol);
    setIsMuted(vol === 0);
    // Immediately apply volume to audio element
    setVolume(vol);
  };

  const handleVolumeSliderChange = (newVolume: number[]) => {
    handleVolumeChange(newVolume);
  };

  const handleMute = () => {
    console.log('[LIBRARY-AUDIO] Mute toggle requested, current state:', isMuted);
    if (isMuted) {
      const newVolume = volume > 0 ? volume : 0.5;
      setVolume(newVolume);
      setIsMuted(false);
      // Immediately apply volume to audio element
      setVolume(newVolume);
    } else {
      setVolume(0);
      setIsMuted(true);
      // Immediately apply volume to audio element
      setVolume(0);
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

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (setSpeed) {
      setSpeed(speed);
    }
  };

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanup();
    };
  }, [cleanup]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-50 shadow-tourism bg-gradient-card border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold truncate text-foreground flex-1">{guide.title}</CardTitle>
          <div className="flex items-center gap-2 shrink-0">
            {!isOnline && (
              <Badge variant="secondary" className="gap-1 text-xs py-0 px-2">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 touch-manipulation">
                ×
              </Button>
            )}
          </div>
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
        <div className="flex items-center justify-center gap-2">
          {/* Skip Back with Label */}
          <div className="flex flex-col items-center gap-1">
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
            <span className="text-xs text-muted-foreground font-medium">15s</span>
          </div>
          
          <Button
            onClick={handlePlayPause}
            disabled={loading}
            size="lg"
            className="h-14 w-14 min-h-[56px] touch-manipulation rounded-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-lg mx-4"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
          
          {/* Skip Forward with Label */}
          <div className="flex flex-col items-center gap-1">
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
            <span className="text-xs text-muted-foreground font-medium">15s</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs touch-manipulation"
          >
            {showAdvanced ? 'Less' : 'More'}
          </Button>
        </div>

        {/* Advanced Controls */}
        {showAdvanced && (
          <div className="space-y-5 pt-4 border-t border-border/50">
            {/* Speed Controls */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Playback Speed</p>
              <div className="grid grid-cols-3 gap-2">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <Button
                    key={speed}
                    variant={playbackSpeed === speed ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleSpeedChange(speed)}
                    className="h-9 text-xs touch-manipulation"
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>

            {/* Volume Control - hidden on mobile */}
            <div className="hidden sm:block">
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Volume</p>
                <div className="flex items-center gap-3 px-1">
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
                  <div className="flex-1">
                    <Slider
                      value={[volume * 100]}
                      onValueChange={handleVolumeSliderChange}
                      max={100}
                      step={1}
                      className="w-full h-3 touch-manipulation"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};