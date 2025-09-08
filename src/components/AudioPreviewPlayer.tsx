import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AudioPreviewPlayerProps {
  title: string;
  guideId?: string;
  audioSrc?: string;
  onClose: () => void;
  isPreview?: boolean;
}

export const AudioPreviewPlayer: React.FC<AudioPreviewPlayerProps> = ({
  title,
  guideId,
  audioSrc,
  onClose,
  isPreview = true,
}) => {
  console.log('🔧 AudioPreviewPlayer initialized', { title, guideId, audioSrc, isPreview });
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualAudioSrc, setActualAudioSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const PREVIEW_DURATION = isPreview ? 30 : null; // 30 seconds preview or unlimited

  // Load audio source
  useEffect(() => {
    const loadAudio = async () => {
      if (audioSrc) {
        setActualAudioSrc(audioSrc);
        return;
      }

      if (guideId) {
        setLoading(true);
        try {
          // Try Supabase storage first
          const { data } = supabase.storage
            .from('guide-audio')
            .getPublicUrl(`${guideId}.mp3`);
          
          let audioUrl = data?.publicUrl;
          if (!audioUrl) {
            // Fallback to public tmp folder
            audioUrl = `/tmp/${guideId}.mp3`;
          }
          
          setActualAudioSrc(audioUrl);
        } catch (error) {
          console.error('Error loading audio:', error);
          setError('Failed to load audio preview');
        } finally {
          setLoading(false);
        }
      }
    };

    loadAudio();
  }, [audioSrc, guideId]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration;
      
      setCurrentTime(current);
      
      if (isPreview && PREVIEW_DURATION) {
        setProgress((current / PREVIEW_DURATION) * 100);
        
        // Stop after 30 seconds for preview
        if (current >= PREVIEW_DURATION) {
          audioRef.current.pause();
          setIsPlaying(false);
          setProgress(100);
        }
      } else {
        // Full audio for purchased users
        setProgress(duration ? (current / duration) * 100 : 0);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !actualAudioSrc) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((error) => {
        console.error('Error playing audio:', error);
        setError('Failed to play audio');
      });
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !actualAudioSrc) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Audio Preview</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-muted-foreground">
            {error || 'Audio preview not available'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Preview: {title}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>
              {isPreview && PREVIEW_DURATION 
                ? `0:${PREVIEW_DURATION.toString().padStart(2, '0')}`
                : formatTime(audioRef.current?.duration || 0)
              }
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={togglePlayPause}
            disabled={!actualAudioSrc}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>

          <div className="flex items-center gap-2 flex-1 ml-4">
            <Button variant="ghost" size="sm" onClick={toggleMute}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {isPreview && (
          <p className="text-xs text-muted-foreground text-center">
            30-second preview • Purchase for full access
          </p>
        )}

        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={actualAudioSrc}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setProgress(100);
          }}
          onError={(e) => {
            console.error('Audio error:', e);
            // Try fallback if primary source fails
            if (actualAudioSrc?.includes('supabase.co') && guideId) {
              const fallbackUrl = `/tmp/${guideId}.mp3`;
              console.log('Trying fallback:', fallbackUrl);
              setActualAudioSrc(fallbackUrl);
            } else {
              setError('Audio file not available');
            }
          }}
          preload="metadata"
        />
      </CardContent>
    </Card>
  );
};