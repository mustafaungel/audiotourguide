import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseInvisibleAudioPlayerProps {
  guideId?: string;
  audioSrc?: string;
  title: string;
  isPreview?: boolean;
}

export const useInvisibleAudioPlayer = ({
  guideId,
  audioSrc,
  title,
  isPreview = true
}: UseInvisibleAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const toastRef = useRef<{ dismiss: () => void } | null>(null);

  const PREVIEW_DURATION = isPreview ? 30 : null;

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    toastRef.current?.dismiss();
  };

  const play = async () => {
    if (isPlaying) return;

    try {
      setLoading(true);
      
      // Get audio source
      let audioUrl = audioSrc;
      if (!audioUrl && guideId) {
        const { data } = supabase.storage
          .from('guide-audio')
          .getPublicUrl(`${guideId}.mp3`);
        audioUrl = data.publicUrl;
      }

      if (!audioUrl) {
        toast({
          title: "Error",
          description: "Audio preview not available",
          variant: "destructive",
        });
        return;
      }

      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.src = audioUrl;
      audio.currentTime = 0;

      // Setup event listeners
      const handleTimeUpdate = () => {
        if (isPreview && PREVIEW_DURATION && audio.currentTime >= PREVIEW_DURATION) {
          audio.pause();
          setIsPlaying(false);
          toastRef.current?.dismiss();
          toast({
            title: "Preview ended",
            description: "Purchase the full guide for complete access",
          });
        }
      };

      const handleEnded = () => {
        setIsPlaying(false);
        toastRef.current?.dismiss();
      };

      const handleError = () => {
        setIsPlaying(false);
        toastRef.current?.dismiss();
        toast({
          title: "Error",
          description: "Failed to play audio preview",
          variant: "destructive",
        });
      };

      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);

      // Start playing
      await audio.play();
      setIsPlaying(true);

      // Show toast notification
      toastRef.current = toast({
        title: `🎵 Playing: ${title}`,
        description: isPreview ? "30-second preview • Purchase for full access" : "Now playing",
      });

      // Cleanup function
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };

    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: "Error",
        description: "Failed to play audio preview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      toastRef.current?.dismiss();
    };
  }, []);

  return {
    play,
    stop,
    isPlaying,
    loading
  };
};