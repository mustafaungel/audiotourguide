import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAudioSource } from '@/hooks/useAudioSource';
import { useIsMobile } from '@/hooks/use-mobile';

interface UseAudioPlayerProps {
  guideId?: string;
  audioSrc?: string;
  title: string;
  isPreview?: boolean;
  previewDuration?: number;
}

export const useAudioPlayer = ({
  guideId,
  audioSrc,
  title,
  isPreview = false,
  previewDuration = 30
}: UseAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const toastRef = useRef<{ dismiss: () => void } | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const { audioSrc: resolvedAudioSrc, loading, error, setError, tryFallback } = useAudioSource({
    guideId,
    audioSrc
  });

  const play = useCallback(async () => {
    if (!audioRef.current || !resolvedAudioSrc || isPlaying) return;

    try {
      // Require explicit user interaction - no autoplay
      await audioRef.current.play();
      setIsPlaying(true);
      setError(null);
      
      // Show toast notification
      toastRef.current = toast({
        title: `🎵 Playing: ${title}`,
        description: isPreview ? `${previewDuration}-second preview` : "Now playing",
      });
    } catch (playError: any) {
      console.error('[AUDIO_PLAYER] Playback failed:', playError);
      
      let errorMessage = "Failed to play audio";
      if (playError.name === 'NotAllowedError') {
        errorMessage = "Click the play button to start audio";
      } else if (playError.name === 'NotSupportedError') {
        errorMessage = "Audio format not supported";
      }
      
      toast({
        title: "Playback Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [resolvedAudioSrc, isPlaying, title, isPreview, previewDuration, toast, setError]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    toastRef.current?.dismiss();
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
    toastRef.current?.dismiss();
  }, []);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration || 0;
    
    setCurrentTime(current);
    
    if (isPreview && current >= previewDuration) {
      // Stop preview after duration limit
      pause();
      toast({
        title: "Preview ended",
        description: "Purchase the full guide for complete access",
      });
      return;
    }
    
    if (total > 0) {
      setProgress((current / total) * 100);
    }
  }, [isPreview, previewDuration, pause, toast]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleError = useCallback(() => {
    console.error('[AUDIO_PLAYER] Audio element error');
    
    // Try fallback first
    if (tryFallback()) {
      return;
    }
    
    // If no fallback available, show error
    setError("Audio file not available");
    setIsPlaying(false);
    toast({
      title: "Audio Error",
      description: "Unable to load audio file",
      variant: "destructive",
    });
  }, [tryFallback, setError, toast]);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    // Show mobile volume feedback
    if (isMobile) {
      toast({
        title: `Volume: ${Math.round(newVolume * 100)}%`,
        description: "Use device volume buttons for hardware control",
        duration: 1500,
      });
    }
  }, [isMobile, toast]);

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
    }
    
    // Show mobile mute feedback
    if (isMobile) {
      toast({
        title: newMuted ? "Audio Muted" : "Audio Unmuted",
        description: newMuted ? "Audio is now muted" : "Audio is now playing",
        duration: 1500,
      });
    }
  }, [isMuted, isMobile, toast]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    toastRef.current?.dismiss();
  }, []);

  return {
    // State
    isPlaying,
    currentTime,
    duration,
    progress,
    volume,
    isMuted,
    loading,
    error,
    audioSrc: resolvedAudioSrc,
    isMobile,
    
    // Actions
    play,
    pause,
    stop,
    togglePlayPause,
    seek,
    handleVolumeChange,
    toggleMute,
    cleanup,
    
    // Event handlers for audio element
    handleTimeUpdate,
    handleLoadedMetadata,
    handleError,
    
    // Refs
    audioRef
  };
};