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
  const fallbackStep = useRef(0);

  const PREVIEW_DURATION = isPreview ? 30 : null;

  const instanceId = useRef(`player_${Math.random().toString(36).slice(2)}`);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    toastRef.current?.dismiss();
  };

  // Listen for other players starting — stop this one
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail !== instanceId.current && isPlaying) {
        stop();
      }
    };
    window.addEventListener('preview-play', handler);
    return () => window.removeEventListener('preview-play', handler);
  }, [isPlaying]);

  const play = async () => {
    if (isPlaying) return;

    // Tell all other players to stop
    window.dispatchEvent(new CustomEvent('preview-play', { detail: instanceId.current }));

    try {
      setLoading(true);
      fallbackAttempted.current = false;
      
      let audioUrl = audioSrc;
      if (!audioUrl && guideId) {
        console.log(`[AUDIO] Getting URL for guide: ${guideId}`);
        const { data } = supabase.storage
          .from('guide-audio')
          .getPublicUrl(`${guideId}.mp3`);
        audioUrl = data.publicUrl;
        console.log(`[AUDIO] Generated URL: ${audioUrl}`);
        
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

      console.log(`[AUDIO] Using audio URL: ${audioUrl}`);

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      
      // Single unified error handler
      const handleError = () => {
        // Try fallback once if primary was supabase
        if (!fallbackAttempted.current && audioUrl!.includes('supabase.co') && guideId) {
          fallbackAttempted.current = true;
          const fallbackUrl = `/tmp/${guideId}.mp3`;
          console.log(`[AUDIO] Trying fallback: ${fallbackUrl}`);
          audio.src = fallbackUrl;
          audio.load();
          return;
        }
        
        console.error('[AUDIO] Audio failed to load');
        toast({
          title: "Audio Not Available",
          description: "Audio file could not be loaded",
          variant: "destructive",
        });
        setIsPlaying(false);
        setLoading(false);
      };

      audio.onerror = handleError;
      audio.src = audioUrl;
      audio.currentTime = chapterTimestamp || 0;
      
      // Wait for audio to be ready
      await new Promise<void>((resolve, reject) => {
        const handleCanPlay = () => {
          audio.removeEventListener('canplay', handleCanPlay);
          resolve();
        };
        audio.addEventListener('canplay', handleCanPlay);
        audio.load();
        
        // Timeout after 10s
        setTimeout(() => {
          audio.removeEventListener('canplay', handleCanPlay);
          reject(new Error('Audio load timeout'));
        }, 10000);
      });

      // Track preview timing
      let previewStartTime: number | null = null;
      
      audio.ontimeupdate = () => {
        if (isPreview && PREVIEW_DURATION) {
          if (previewStartTime === null) {
            previewStartTime = Date.now();
          }
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

      audio.onended = () => {
        setIsPlaying(false);
        toastRef.current?.dismiss();
      };

      try {
        await audio.play();
        setIsPlaying(true);
        
        toastRef.current = toast({
          title: `🎵 Playing: ${title}`,
          description: isPreview ? "30-second preview • Purchase for full access" : "Now playing",
        });
      } catch (playError: any) {
        console.error('[AUDIO] Playback failed:', playError);
        const msg = playError.name === 'NotAllowedError' 
          ? "Please click the play button to start audio"
          : playError.name === 'NotSupportedError'
            ? "This audio format is not supported by your browser"
            : "Failed to play audio. Please try again.";
        toast({ title: "Playback Error", description: msg, variant: "destructive" });
      }
    } catch (error: any) {
      console.error('[AUDIO] Error playing audio:', error);
      toast({
        title: "Playback Error",
        description: error.message?.includes('timeout') ? "Audio took too long to load" : "Failed to play audio preview",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      toastRef.current?.dismiss();
    };
  }, []);

  return { play, stop, isPlaying, loading };
};
