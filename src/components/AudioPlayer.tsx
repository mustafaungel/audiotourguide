import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AudioPlayerProps {
  title?: string;
  description?: string;
  audioSrc?: string;
  guideId?: string;
  transcript?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  title = "Audio Guide",
  description = "Audio guide content",
  audioSrc,
  guideId,
  transcript,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualAudioSrc, setActualAudioSrc] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [savedPosition, setSavedPosition] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Load audio from storage bucket and saved position
  useEffect(() => {
    const loadAudio = async () => {
      if (audioSrc) {
        console.log('[AUDIOPLAYER] Using provided audioSrc:', audioSrc);
        setActualAudioSrc(audioSrc);
        return;
      }

      if (guideId) {
        setLoading(true);
        setError(null);
        try {
          console.log('[AUDIOPLAYER] Loading audio for guide:', guideId);
          
          // Try to get audio file from storage bucket
          const { data } = supabase.storage
            .from('guide-audio')
            .getPublicUrl(`${guideId}.mp3`);
          
          let audioUrl = data?.publicUrl;
          if (!audioUrl) {
            // Fallback to public tmp folder
            audioUrl = `/tmp/${guideId}.mp3`;
            console.log('[AUDIOPLAYER] Using fallback URL:', audioUrl);
          } else {
            console.log('[AUDIOPLAYER] Generated public URL:', audioUrl);
          }
          
          // Set audio source and let audio element handle validation
          setActualAudioSrc(audioUrl);
          
          // Load saved position from localStorage
          const savedPos = localStorage.getItem(`audio-position-${guideId}`);
          if (savedPos) {
            setSavedPosition(parseFloat(savedPos));
          }
        } catch (err) {
          console.error('[AUDIOPLAYER] Error loading audio:', err);
          setError("Failed to load audio");
        } finally {
          setLoading(false);
        }
      }
    };

    loadAudio();
  }, [audioSrc, guideId]);

  // Apply saved position when audio loads
  useEffect(() => {
    if (audioRef.current && savedPosition > 0) {
      audioRef.current.currentTime = savedPosition;
    }
  }, [actualAudioSrc, savedPosition]);

  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current || !actualAudioSrc) {
      console.warn('[AUDIOPLAYER] Cannot play - no audio element or source');
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        console.log('[AUDIOPLAYER] Attempting to play audio');
        await audioRef.current.play();
        setError(null); // Clear any previous errors on successful play
      }
    } catch (err: any) {
      console.error('[AUDIOPLAYER] Error playing audio:', err);
      let errorMessage = "Failed to play audio";
      
      if (err.name === 'NotAllowedError') {
        errorMessage = "Audio blocked by browser - try clicking play button again";
      } else if (err.name === 'NotSupportedError') {
        errorMessage = "Audio format not supported";
      }
      
      setError(errorMessage);
      toast({
        title: "Playback Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [isPlaying, actualAudioSrc, toast]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !isMuted;
      audioRef.current.muted = newMuted;
      setIsMuted(newMuted);
    }
  }, [isMuted]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      if (newVolume === 0) {
        setIsMuted(true);
      } else if (isMuted) {
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + 15,
        audioRef.current.duration
      );
    }
  }, []);

  const skipBackward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        audioRef.current.currentTime - 15,
        0
      );
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
    }
  }, []);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    setError(null);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackSpeed;
      
      // Apply saved position if available
      if (savedPosition > 0) {
        audioRef.current.currentTime = savedPosition;
      }
    }
  }, [volume, playbackSpeed, savedPosition]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  }, [duration]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSpeedChange = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, []);

  const handleDownload = useCallback(async () => {
    if (!actualAudioSrc) return;
    
    try {
      const response = await fetch(actualAudioSrc);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Download started",
        description: "Audio guide is being downloaded",
      });
    } catch (err) {
      console.error('Download failed:', err);
      toast({
        title: "Download failed",
        description: "Unable to download audio file",
        variant: "destructive",
      });
    }
  }, [actualAudioSrc, title, toast]);

  const savePosition = useCallback(() => {
    if (audioRef.current && guideId) {
      localStorage.setItem(`audio-position-${guideId}`, audioRef.current.currentTime.toString());
    }
  }, [guideId]);

  // Save position every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        savePosition();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isPlaying, savePosition]);

  const SimpleProgressIndicator = () => (
    <div className="h-12 flex items-center justify-center">
      <div className={`w-16 h-16 rounded-full border-4 border-primary/20 relative flex items-center justify-center transition-all duration-300 ${
        isPlaying ? 'border-primary/40 scale-105' : ''
      }`}>
        <div className={`w-8 h-8 rounded-full bg-gradient-primary transition-all duration-300 ${
          isPlaying ? 'animate-pulse' : ''
        }`} />
      </div>
    </div>
  );

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card p-6">
      <div className="space-y-4">
        {/* Title and Description */}
        <div className="text-center space-y-2 sm:space-y-3">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground">{title}</h3>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">{description}</p>
        </div>

        {/* Progress Indicator */}
        <SimpleProgressIndicator />

        {/* Progress Bar */}
        <div className="space-y-2">
          <div 
            className="w-full h-2 bg-muted rounded-full cursor-pointer overflow-hidden"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-gradient-primary transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-center text-destructive text-sm bg-destructive/10 p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={skipBackward}
            disabled={!actualAudioSrc || loading}
            className="h-14 w-14 sm:h-16 sm:w-16 min-h-[56px] touch-manipulation rounded-full"
            title="Skip back 15 seconds"
          >
            <SkipBack className="h-6 w-6" />
          </Button>
          
          <Button 
            variant="default" 
            size="lg"
            onClick={togglePlayPause}
            disabled={!actualAudioSrc || loading}
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full min-h-[80px] touch-manipulation bg-gradient-primary hover:bg-gradient-primary/90 shadow-lg"
          >
            {loading ? (
              <div className="animate-spin h-8 w-8 border-2 border-current border-t-transparent rounded-full" />
            ) : isPlaying ? (
              <Pause className="h-8 w-8" />
            ) : (
              <Play className="h-8 w-8 ml-1" />
            )}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={skipForward}
            disabled={!actualAudioSrc || loading}
            className="h-14 w-14 sm:h-16 sm:w-16 min-h-[56px] touch-manipulation rounded-full"
            title="Skip forward 15 seconds"
          >
            <SkipForward className="h-6 w-6" />
          </Button>
        </div>

        {/* Essential Volume Control (Always Visible) */}
        <div className="flex items-center justify-center gap-4 pt-2 sm:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-12 w-12 min-h-[48px] touch-manipulation rounded-full"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Desktop Volume Control */}
        <div className="hidden sm:flex items-center justify-center gap-4 pt-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-10 w-10 min-h-[40px] touch-manipulation"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Volume2 className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
          <div 
            className="w-32 sm:w-40 h-3 bg-muted rounded-full cursor-pointer touch-manipulation"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newVolume = clickX / rect.width;
              handleVolumeChange(Math.max(0, Math.min(1, newVolume)));
            }}
          >
            <div 
              className="h-full bg-gradient-primary rounded-full transition-all duration-300"
              style={{ width: `${isMuted ? 0 : volume * 100}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {savedPosition > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = savedPosition;
                }
              }}
              className="text-xs touch-manipulation"
            >
              Resume: {formatTime(savedPosition)}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs touch-manipulation"
          >
            {showAdvanced ? 'Less' : 'More'}
          </Button>
        </div>

        {/* Advanced Controls (Progressive Disclosure) */}
        {showAdvanced && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            {/* Playback Speed Controls */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-muted-foreground mr-2">Speed:</span>
              {[0.75, 1, 1.25, 1.5].map((speed) => (
                <Button
                  key={speed}
                  variant={playbackSpeed === speed ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleSpeedChange(speed)}
                  className="h-8 px-3 text-xs touch-manipulation"
                >
                  {speed}x
                </Button>
              ))}
            </div>

            {/* Mobile Volume Slider */}
            <div className="sm:hidden flex items-center justify-center gap-4">
              <span className="text-xs text-muted-foreground">Volume:</span>
              <div 
                className="w-48 h-3 bg-muted rounded-full cursor-pointer touch-manipulation"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const newVolume = clickX / rect.width;
                  handleVolumeChange(Math.max(0, Math.min(1, newVolume)));
                }}
              >
                <div 
                  className="h-full bg-gradient-primary rounded-full transition-all duration-300"
                  style={{ width: `${isMuted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>

            {/* Additional Controls */}
            <div className="flex items-center justify-center gap-3">
              {transcript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-xs touch-manipulation"
                >
                  {showTranscript ? 'Hide' : 'Show'} Transcript
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={!actualAudioSrc}
                className="text-xs touch-manipulation"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Transcript Content */}
        {showTranscript && transcript && (
          <div className="mt-4 p-4 bg-muted/50 rounded-md">
            <h4 className="text-sm font-medium mb-2">Transcript</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {transcript}
            </p>
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      {actualAudioSrc && (
        <audio
          ref={audioRef}
          src={actualAudioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handlePlay}
          onPause={handlePause}
          onEnded={handleEnded}
          onError={(e) => {
            console.error('[AUDIOPLAYER] Audio error:', e);
            // Try fallback if primary source fails
            if (actualAudioSrc.includes('supabase.co') && guideId) {
              const fallbackUrl = `/tmp/${guideId}.mp3`;
              console.log('[AUDIOPLAYER] Trying fallback:', fallbackUrl);
              setActualAudioSrc(fallbackUrl);
            } else {
              setError("Audio file not available");
            }
          }}
          preload="metadata"
        />
      )}
    </Card>
  );
};