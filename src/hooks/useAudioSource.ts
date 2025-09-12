import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { withRetry, regionalRetryOptions, isNetworkError, getRegionalErrorMessage, isLikelyRegionalIssue } from '@/utils/networkUtils';

interface UseAudioSourceProps {
  guideId?: string;
  audioSrc?: string;
}

export const useAudioSource = ({ guideId, audioSrc }: UseAudioSourceProps) => {
  const [actualAudioSrc, setActualAudioSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegionalIssue, setIsRegionalIssue] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  useEffect(() => {
    const loadAudioSource = async () => {
      // If audioSrc is provided, use it directly but still validate access
      if (audioSrc) {
        setActualAudioSrc(audioSrc);
        await validateAudioAccess(audioSrc);
        return;
      }

      // If guideId is provided, try to get audio from storage
      if (guideId) {
        setLoading(true);
        setError(null);
        setIsRegionalIssue(false);
        setFallbackAttempted(false);
        
        try {
          console.log(`[AUDIO_SOURCE] Loading for guide: ${guideId}`);
          
          // Try multiple audio sources with retry logic
          const audioUrl = await withRetry(async () => {
            // Try Supabase storage first
            const { data } = supabase.storage
              .from('guide-audio')
              .getPublicUrl(`${guideId}.mp3`);
            
            if (data?.publicUrl) {
              console.log(`[AUDIO_SOURCE] Using Supabase URL: ${data.publicUrl}`);
              // Validate that the URL is actually accessible
              await validateAudioAccess(data.publicUrl);
              return data.publicUrl;
            }
            
            throw new Error('No Supabase URL available');
          }, regionalRetryOptions);
          
          setActualAudioSrc(audioUrl);
        } catch (err) {
          console.error('[AUDIO_SOURCE] Error loading from Supabase storage:', err);
          
          // Check if this looks like a regional issue
          if (isLikelyRegionalIssue(err)) {
            setIsRegionalIssue(true);
            setError(getRegionalErrorMessage(err));
          } else {
            setError(isNetworkError(err) ? getRegionalErrorMessage(err) : 'Failed to load audio source');
          }
          
          // Try fallback URL
          await attemptFallback();
        } finally {
          setLoading(false);
        }
      }
    };

    const validateAudioAccess = async (url: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => {
          // Try a different validation method for audio
          fetch(url, { method: 'HEAD', mode: 'no-cors' })
            .then(() => resolve())
            .catch(reject);
        };
        img.src = url;
      });
    };

    const attemptFallback = async () => {
      if (!guideId || fallbackAttempted) return;
      
      setFallbackAttempted(true);
      console.log(`[AUDIO_SOURCE] Attempting fallback for guide: ${guideId}`);
      
      try {
        const fallbackUrl = `/tmp/${guideId}.mp3`;
        await validateAudioAccess(fallbackUrl);
        console.log(`[AUDIO_SOURCE] Fallback successful: ${fallbackUrl}`);
        setActualAudioSrc(fallbackUrl);
        setError(null);
        setIsRegionalIssue(false);
      } catch (fallbackErr) {
        console.error('[AUDIO_SOURCE] Fallback also failed:', fallbackErr);
        // Keep the original error message
      }
    };

    loadAudioSource();
  }, [audioSrc, guideId, fallbackAttempted]);

  // Enhanced fallback function
  const tryFallback = async () => {
    if (guideId && !fallbackAttempted) {
      setLoading(true);
      setFallbackAttempted(true);
      
      try {
        const fallbackUrl = `/tmp/${guideId}.mp3`;
        console.log(`[AUDIO_SOURCE] Manual fallback attempt: ${fallbackUrl}`);
        
        // Try to validate the fallback URL
        await new Promise((resolve, reject) => {
          const audio = new Audio();
          audio.oncanplaythrough = () => resolve(true);
          audio.onerror = reject;
          audio.src = fallbackUrl;
        });
        
        setActualAudioSrc(fallbackUrl);
        setError(null);
        setIsRegionalIssue(false);
        setLoading(false);
        return true;
      } catch (err) {
        console.error(`[AUDIO_SOURCE] Manual fallback failed:`, err);
        setLoading(false);
        return false;
      }
    }
    return false;
  };

  // Force retry function for user-initiated retries
  const forceRetry = () => {
    setFallbackAttempted(false);
    setError(null);
    setIsRegionalIssue(false);
    // Trigger useEffect re-run by updating a dependency
    if (guideId) {
      const loadAudioSource = async () => {
        setLoading(true);
        try {
          const { data } = supabase.storage
            .from('guide-audio')
            .getPublicUrl(`${guideId}.mp3`);
          
          if (data?.publicUrl) {
            setActualAudioSrc(data.publicUrl);
          }
        } catch (err) {
          console.error('[AUDIO_SOURCE] Force retry failed:', err);
          await tryFallback();
        } finally {
          setLoading(false);
        }
      };
      loadAudioSource();
    }
  };

  return {
    audioSrc: actualAudioSrc,
    loading,
    error,
    isRegionalIssue,
    fallbackAttempted,
    setError,
    tryFallback,
    forceRetry
  };
};