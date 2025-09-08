import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseLibraryAudioProps {
  guideId: string;
  accessCode?: string;
  title: string;
}

export const useLibraryAudio = ({ guideId, accessCode, title }: UseLibraryAudioProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const loadAudioSource = async () => {
    try {
      setLoading(true);
      
      // Try to get audio from Supabase storage first
      const { data: urlData } = await supabase.storage
        .from('guide-audio')
        .createSignedUrl(`${guideId}.mp3`, 3600);
      
      if (urlData?.signedUrl) {
        setAudioSrc(urlData.signedUrl);
        return urlData.signedUrl;
      }
      
      // Fallback to public directory
      const fallbackUrl = `/tmp/${guideId}.mp3`;
      setAudioSrc(fallbackUrl);
      return fallbackUrl;
    } catch (error) {
      console.error('Error loading audio source:', error);
      toast({
        title: 'Audio Error',
        description: 'Failed to load audio source',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const play = async () => {
    try {
      if (!audioRef.current) {
        // Create audio element if it doesn't exist
        const audio = new Audio();
        audioRef.current = audio;
        
        // Set up event listeners
        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime);
        });
        
        audio.addEventListener('loadedmetadata', () => {
          setDuration(audio.duration);
        });
        
        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setCurrentTime(0);
        });
        
        audio.addEventListener('error', () => {
          toast({
            title: 'Playback Error',
            description: 'Failed to play audio file',
            variant: 'destructive',
          });
          setIsPlaying(false);
        });
      }

      if (!audioSrc) {
        const src = await loadAudioSource();
        if (!src) return;
      }

      if (audioRef.current && audioSrc) {
        audioRef.current.src = audioSrc;
        audioRef.current.volume = volume;
        
        await audioRef.current.play();
        setIsPlaying(true);
        
        toast({
          title: 'Now Playing',
          description: title,
        });
      }
    } catch (error) {
      console.error('Play error:', error);
      toast({
        title: 'Playback Error',
        description: 'Failed to start playback',
        variant: 'destructive',
      });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const setVolumeLevel = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const cleanup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return {
    isPlaying,
    loading,
    currentTime,
    duration,
    volume,
    play,
    pause,
    stop,
    seek,
    setVolume: setVolumeLevel,
    cleanup,
  };
};