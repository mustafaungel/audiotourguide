import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseInvisibleAudioPlayerProps {
  guideId?: string;
  audioSrc?: string;
  title: string;
  isPreview?: boolean;
  chapterTimestamp?: number;
}

export const useInvisibleAudioPlayer = ({
  guideId,
  audioSrc,
  title,
  isPreview = true,
  chapterTimestamp = 0
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
      
      // Get audio source with validation and fallback
      let audioUrl = audioSrc;
      if (!audioUrl && guideId) {
        console.log(`[AUDIO] Getting URL for guide: ${guideId}`);
        
        // First try Supabase storage
        const { data } = supabase.storage
          .from('guide-audio')
          .getPublicUrl(`${guideId}.mp3`);
        audioUrl = data.publicUrl;
        console.log(`[AUDIO] Generated URL: ${audioUrl}`);
        
        // If that fails, try fallback to public tmp folder
        if (!audioUrl) {
          audioUrl = `/tmp/${guideId}.mp3`;
          console.log(`[AUDIO] Using fallback URL: ${audioUrl}`);
        }
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

      // No need to validate with HEAD request - let audio element handle errors
      console.log(`[AUDIO] Using audio URL: ${audioUrl}`);

      // Create or reuse audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      
      // Setup fallback error handling before setting src
      const handleAudioError = () => {
        console.log('[AUDIO] Primary source failed, trying fallback');
        if (audioUrl.includes('supabase.co') && guideId) {
          const fallbackUrl = `/tmp/${guideId}.mp3`;
          console.log(`[AUDIO] Trying fallback: ${fallbackUrl}`);
          audio.src = fallbackUrl;
          audio.load();
        } else {
          console.error('[AUDIO] No fallback available');
          toast({
            title: "Audio Not Available",
            description: "Audio file could not be loaded",
            variant: "destructive",
          });
          setLoading(false);
        }
      };

      // Add error listener before setting source
      audio.addEventListener('error', handleAudioError, { once: true });
      audio.src = audioUrl;
      audio.currentTime = chapterTimestamp || 0;
      
      // Wait for audio to be ready
      await new Promise((resolve, reject) => {
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleLoadError);
          resolve(undefined);
        };
        
        const handleLoadError = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          audio.removeEventListener('error', handleLoadError);
          reject(new Error('Audio failed to load'));
        };
        
        audio.addEventListener('canplay', handleCanPlay);
        audio.addEventListener('error', handleLoadError);
        
        audio.load();
      });

      // Track when preview started for precise 30s timing
      let previewStartTime: number | null = null;
      
      // Setup event listeners
      const handleTimeUpdate = () => {
        if (isPreview && PREVIEW_DURATION) {
          // Record the start time when playback begins
          if (previewStartTime === null) {
            previewStartTime = Date.now();
          }
          
          // Calculate elapsed time in seconds
          const elapsedTime = (Date.now() - previewStartTime) / 1000;
          
          if (elapsedTime >= PREVIEW_DURATION) {
            console.log(`[AUDIO] Preview stopped after ${elapsedTime.toFixed(1)}s`);
            audio.pause();
            setIsPlaying(false);
            toastRef.current?.dismiss();
            toast({
              title: "Preview ended",
              description: "Purchase the full guide for complete access",
            });
          }
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

      // Start playing (require user interaction - no autoplay)
      try {
        // Only attempt play if user explicitly called this function
        await audio.play();
        setIsPlaying(true);
        
        // Show toast notification
        toastRef.current = toast({
          title: `🎵 Playing: ${title}`,
          description: isPreview ? "30-second preview • Purchase for full access" : "Now playing",
        });
      } catch (playError: any) {
        console.error('[AUDIO] Playback failed:', playError);
        if (playError.name === 'NotAllowedError') {
          toast({
            title: "Click Required",
            description: "Please click the play button to start audio",
            variant: "destructive",
          });
        } else if (playError.name === 'NotSupportedError') {
          toast({
            title: "Format Not Supported",
            description: "This audio format is not supported by your browser",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Playback Error",
            description: "Failed to play audio. Please try again.",
            variant: "destructive",
          });
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