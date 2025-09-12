import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseAudioSourceProps {
  guideId?: string;
  audioSrc?: string;
}

export const useAudioSource = ({ guideId, audioSrc }: UseAudioSourceProps) => {
  const [actualAudioSrc, setActualAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAudioSource = async () => {
      // If audioSrc is provided, use it directly
      if (audioSrc) {
        setActualAudioSrc(audioSrc);
        return;
      }

      // If guideId is provided, try to get audio from storage
      if (guideId) {
        setLoading(true);
        setError(null);
        
        try {
          console.log(`[AUDIO_SOURCE] Loading for guide: ${guideId}`);
          
          // Try Supabase storage first
          const { data } = supabase.storage
            .from('guide-audio')
            .getPublicUrl(`${guideId}.mp3`);
          
          let audioUrl = data?.publicUrl;
          
          // If no Supabase URL, try fallback
          if (!audioUrl) {
            audioUrl = `/tmp/${guideId}.mp3`;
            console.log(`[AUDIO_SOURCE] Using fallback URL: ${audioUrl}`);
          } else {
            console.log(`[AUDIO_SOURCE] Using Supabase URL: ${audioUrl}`);
          }
          
          setActualAudioSrc(audioUrl);
        } catch (err) {
          console.error('[AUDIO_SOURCE] Error loading audio:', err);
          setError('Failed to load audio source');
        } finally {
          setLoading(false);
        }
      }
    };

    loadAudioSource();
  }, [audioSrc, guideId]);

  // Function to try fallback URL when primary fails
  const tryFallback = () => {
    if (guideId && actualAudioSrc?.includes('supabase.co')) {
      const fallbackUrl = `/tmp/${guideId}.mp3`;
      console.log(`[AUDIO_SOURCE] Trying fallback: ${fallbackUrl}`);
      setActualAudioSrc(fallbackUrl);
      setError(null);
      return true;
    }
    return false;
  };

  return {
    audioSrc: actualAudioSrc,
    loading,
    error,
    setError,
    tryFallback
  };
};