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
      
      // Get audio source with validation
      let audioUrl = audioSrc;
      if (!audioUrl && guideId) {
        console.log(`[AUDIO] Getting URL for guide: ${guideId}`);
        const { data } = supabase.storage
          .from('guide-audio')
          .getPublicUrl(`${guideId}.mp3`);
        audioUrl = data.publicUrl;
        console.log(`[AUDIO] Generated URL: ${audioUrl}`);
      }

      if (!audioUrl) {
        console.error('[AUDIO] No audio URL available');
        toast({
          title: "Audio Not Available",
          description: "Preview is not available for this guide",
          variant: "destructive",
        });
        return;
      }

      // Validate that audio file exists by attempting to fetch
      try {
        const response = await fetch(audioUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error(`Audio file not found: ${response.status}`);
        }
      } catch (fetchError) {
        console.error('[AUDIO] Audio file validation failed:', fetchError);
        toast({
          title: "Audio File Not Found",
          description: "The audio file for this guide is not available",
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
      
      // Wait for audio to be ready before playing
      await new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          resolve(undefined);
        };
        
        const handleError = (e: any) => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleError);
          reject(new Error('Audio failed to load'));
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleError);
        
        audio.load();
      });

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

      // Start playing (handle autoplay restrictions)
      try {
        await audio.play();
        setIsPlaying(true);
        
        // Show toast notification
        toastRef.current = toast({
          title: `🎵 Playing: ${title}`,
          description: isPreview ? "30-second preview • Purchase for full access" : "Now playing",
        });
      } catch (playError: any) {
        console.error('[AUDIO] Autoplay blocked or failed:', playError);
        if (playError.name === 'NotAllowedError') {
          toast({
            title: "Audio Blocked",
            description: "Please click play button to start audio (browser policy)",
            variant: "destructive",
          });
        } else {
          throw playError;
        }
      }

      // Cleanup function
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };

    } catch (error: any) {
      console.error('[AUDIO] Error playing audio:', error);
      let errorMessage = "Failed to play audio preview";
      
      if (error.name === 'NotSupportedError') {
        errorMessage = "Audio format not supported by this browser";
      } else if (error.name === 'NotAllowedError') {
        errorMessage = "Audio playback blocked by browser";
      } else if (error.message?.includes('not found')) {
        errorMessage = "Audio file not found";
      }
      
      toast({
        title: "Playback Error",
        description: errorMessage,
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