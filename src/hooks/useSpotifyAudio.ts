import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Section {
  id: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
  start_time?: number;
}

interface UseSpotifyAudioProps {
  guideId: string;
  sections?: Section[];
  mainAudioUrl?: string;
  accessCode?: string;
  title: string;
}

/**
 * Synchronously resolve an audio URL — no async, no signed URLs.
 * Keeps the user-gesture context intact for mobile playback.
 */
const resolveAudioUrl = (guideId: string, audioPath?: string, mainAudioUrl?: string): string => {
  const url = audioPath || mainAudioUrl;
  if (!url) return `/tmp/${guideId}.mp3`;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/storage/v1/object/public')) {
    return `https://dsaqlgxajdnwoqvtsrqd.supabase.co${url}`;
  }
  const { data } = supabase.storage.from('guide-audio').getPublicUrl(url);
  return data?.publicUrl || `/tmp/${guideId}.mp3`;
};

export const useSpotifyAudio = ({ 
  guideId, 
  sections = [], 
  mainAudioUrl, 
  accessCode, 
  title 
}: UseSpotifyAudioProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentSection, setCurrentSection] = useState(0);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const repeatModeRef = useRef(repeatMode);
  const currentSectionRef = useRef(currentSection);
  const { toast } = useToast();

  // Keep refs in sync
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { currentSectionRef.current = currentSection; }, [currentSection]);

  const handleAudioEnd = useCallback(() => {
    const mode = repeatModeRef.current;
    const section = currentSectionRef.current;
    
    switch (mode) {
      case 'one':
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        break;
      case 'all':
        if (section < sections.length - 1) {
          playSection(section + 1);
        } else if (sections.length > 0) {
          playSection(0);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
        break;
      default:
        if (section < sections.length - 1) {
          playSection(section + 1);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
    }
  }, [sections.length]);

  const setupAudioElement = useCallback((audio: HTMLAudioElement) => {
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      audio.playbackRate = playbackSpeed;
      audio.volume = Math.min(1, Math.max(0, volume));
    });
    
    audio.addEventListener('ended', () => {
      handleAudioEnd();
    });
    
    audio.addEventListener('error', () => {
      toast({
        title: 'Playback Error',
        description: 'Failed to play audio file',
        variant: 'destructive',
      });
      setIsPlaying(false);
    });
  }, [playbackSpeed, volume, handleAudioEnd]);

  /**
   * Synchronous play — resolves URL without async, keeps gesture context.
   */
  const play = (sectionIndex?: number) => {
    try {
      const targetSection = sectionIndex ?? currentSection;
      
      // Pause existing playback to prevent overlap
      if (audioRef.current) {
        audioRef.current.pause();
      }

      if (!audioRef.current) {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.setAttribute('playsinline', '');
        audioRef.current = audio;
        setupAudioElement(audio);
      }

      // Resolve URL synchronously
      const sectionAudioUrl = sections[targetSection]?.audio_url;
      const resolvedUrl = resolveAudioUrl(guideId, sectionAudioUrl, mainAudioUrl);
      
      setAudioSrc(resolvedUrl);
      
      audioRef.current.src = resolvedUrl;
      audioRef.current.volume = Math.min(1, Math.max(0, volume));
      audioRef.current.playbackRate = playbackSpeed;
      
      if (sections[targetSection]?.start_time) {
        audioRef.current.currentTime = sections[targetSection].start_time!;
      }
      
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setCurrentSection(targetSection);
            const sectionTitle = sections[targetSection]?.title || title;
            toast({ title: 'Now Playing', description: sectionTitle });
          })
          .catch((error) => {
            console.error('[AUDIO] Play error:', error);
            if (error.name !== 'AbortError') {
              toast({ title: 'Playback Error', description: 'Failed to start playback', variant: 'destructive' });
            }
            setIsPlaying(false);
          });
      }
      
      setCurrentSection(targetSection);
    } catch (error) {
      console.error('[AUDIO] Play error:', error);
      toast({ title: 'Playback Error', description: 'Failed to start playback', variant: 'destructive' });
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

  const playSection = (index: number) => {
    if (index >= 0 && index < sections.length) {
      play(index);
    }
  };

  const nextSection = () => {
    let nextIndex = currentSection + 1;
    
    if (isShuffled) {
      const availableIndices = sections.map((_, i) => i).filter(i => i !== currentSection);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }
    
    if (nextIndex < sections.length) {
      playSection(nextIndex);
    } else if (repeatMode === 'all') {
      playSection(0);
    }
  };

  const previousSection = () => {
    if (currentSection > 0) {
      playSection(currentSection - 1);
    } else if (repeatMode === 'all') {
      playSection(sections.length - 1);
    }
  };

  const setVolumeLevel = (newVolume: number) => {
    const normalized = Math.min(1, Math.max(0, newVolume));
    setVolume(normalized);
    if (audioRef.current) {
      audioRef.current.volume = normalized;
    }
  };

  const setSpeedLevel = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled);
    toast({
      title: isShuffled ? 'Shuffle Off' : 'Shuffle On',
      description: isShuffled ? 'Playing in order' : 'Playing randomly',
    });
  };

  const toggleRepeat = () => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeatMode(nextMode);
    
    const modeLabels = { none: 'Repeat Off', one: 'Repeat One', all: 'Repeat All' };
    toast({ title: modeLabels[nextMode], description: `Repeat mode: ${nextMode}` });
  };

  const skip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    seek(newTime);
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

  // Update audio settings when they change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, Math.max(0, volume));
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, playbackSpeed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const currentSectionData = sections[currentSection];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    isPlaying,
    loading,
    currentTime,
    duration,
    progress,
    volume,
    playbackSpeed,
    currentSection,
    currentSectionData,
    sections,
    isShuffled,
    repeatMode,
    play,
    pause,
    stop,
    seek,
    skip,
    playSection,
    nextSection,
    previousSection,
    setVolume: setVolumeLevel,
    setSpeed: setSpeedLevel,
    toggleShuffle,
    toggleRepeat,
    cleanup,
  };
};
