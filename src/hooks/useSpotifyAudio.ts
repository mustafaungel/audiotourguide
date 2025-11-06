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
  const { toast } = useToast();

  const loadAudioSource = async (sectionIndex?: number) => {
    try {
      setLoading(true);
      console.log('[AUDIO] Loading audio source:', { guideId, sectionIndex, hasMainUrl: !!mainAudioUrl });
      
      let audioUrl = mainAudioUrl;
      
      // If we have sections and a specific section is requested
      if (sections.length > 0 && sectionIndex !== undefined && sections[sectionIndex]?.audio_url) {
        audioUrl = sections[sectionIndex].audio_url;
        console.log('[AUDIO] Using section audio URL');
      }
      
      if (audioUrl) {
        console.log('[AUDIO] Using provided audio URL:', audioUrl.substring(0, 50) + '...');
        setAudioSrc(audioUrl);
        return audioUrl;
      }
      
      // Try to get audio from Supabase storage
      console.log('[AUDIO] Fetching from Supabase storage...');
      const { data: urlData } = await supabase.storage
        .from('guide-audio')
        .createSignedUrl(`${guideId}.mp3`, 3600);
      
      if (urlData?.signedUrl) {
        console.log('[AUDIO] Got Supabase signed URL');
        setAudioSrc(urlData.signedUrl);
        return urlData.signedUrl;
      }
      
      // Fallback to public directory
      const fallbackUrl = `/tmp/${guideId}.mp3`;
      console.log('[AUDIO] Using fallback URL:', fallbackUrl);
      setAudioSrc(fallbackUrl);
      return fallbackUrl;
    } catch (error) {
      console.error('[AUDIO] Error loading audio source:', error);
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

  const setupAudioElement = useCallback((audio: HTMLAudioElement) => {
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      audio.playbackRate = playbackSpeed;
      audio.volume = volume;
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
  }, [playbackSpeed, volume]);

  const handleAudioEnd = useCallback(() => {
    switch (repeatMode) {
      case 'one':
        // Repeat current section
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        break;
      case 'all':
        // Go to next section or loop back to first
        if (currentSection < sections.length - 1) {
          playSection(currentSection + 1);
        } else if (sections.length > 0) {
          playSection(0);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
        break;
      default:
        // Auto-advance to next section if available
        if (currentSection < sections.length - 1) {
          playSection(currentSection + 1);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
    }
  }, [repeatMode, currentSection, sections.length]);

  const play = async (sectionIndex?: number) => {
    try {
      const targetSection = sectionIndex ?? currentSection;
      
      if (!audioRef.current) {
        const audio = new Audio();
        audioRef.current = audio;
        setupAudioElement(audio);
      }

      // Load audio source if needed and store in local variable
      let currentAudioSrc = audioSrc;
      if (!audioSrc || sectionIndex !== undefined) {
        console.log('[AUDIO] Play: Loading audio source for section', targetSection);
        const src = await loadAudioSource(targetSection);
        if (!src) {
          console.error('[AUDIO] Play: Failed to load audio source');
          return;
        }
        currentAudioSrc = src; // Use freshly loaded src
        console.log('[AUDIO] Play: Audio source loaded successfully');
      }

      // Use currentAudioSrc (not audioSrc state) to ensure we have the latest value
      if (audioRef.current && currentAudioSrc) {
        console.log('[AUDIO] Play: Setting audio src and starting playback');
        audioRef.current.src = currentAudioSrc;
        audioRef.current.volume = volume;
        audioRef.current.playbackRate = playbackSpeed;
        
        // If playing a specific section with start time
        if (sections[targetSection]?.start_time) {
          audioRef.current.currentTime = sections[targetSection].start_time!;
          console.log('[AUDIO] Play: Set start time to', sections[targetSection].start_time);
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
        setCurrentSection(targetSection);
        console.log('[AUDIO] Play: Playback started successfully');
        
        const sectionTitle = sections[targetSection]?.title || title;
        toast({
          title: 'Now Playing',
          description: sectionTitle,
        });
      } else {
        console.error('[AUDIO] Play: Missing audio ref or src', { 
          hasAudioRef: !!audioRef.current, 
          currentAudioSrc 
        });
      }
    } catch (error) {
      console.error('[AUDIO] Play error:', error);
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

  const playSection = async (index: number) => {
    if (index >= 0 && index < sections.length) {
      await play(index);
    }
  };

  const nextSection = async () => {
    let nextIndex = currentSection + 1;
    
    if (isShuffled) {
      // Random next section
      const availableIndices = sections.map((_, i) => i).filter(i => i !== currentSection);
      nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }
    
    if (nextIndex < sections.length) {
      await playSection(nextIndex);
    } else if (repeatMode === 'all') {
      await playSection(0);
    }
  };

  const previousSection = async () => {
    if (currentSection > 0) {
      await playSection(currentSection - 1);
    } else if (repeatMode === 'all') {
      await playSection(sections.length - 1);
    }
  };

  const setVolumeLevel = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
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
    
    const modeLabels = {
      none: 'Repeat Off',
      one: 'Repeat One',
      all: 'Repeat All'
    };
    
    toast({
      title: modeLabels[nextMode],
      description: `Repeat mode: ${nextMode}`,
    });
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
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [volume, playbackSpeed]);

  const currentSectionData = sections[currentSection];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return {
    // Playback state
    isPlaying,
    loading,
    currentTime,
    duration,
    progress,
    volume,
    playbackSpeed,
    
    // Section state
    currentSection,
    currentSectionData,
    sections,
    
    // Playlist state
    isShuffled,
    repeatMode,
    
    // Playback controls
    play,
    pause,
    stop,
    seek,
    skip,
    
    // Section controls
    playSection,
    nextSection,
    previousSection,
    
    // Settings
    setVolume: setVolumeLevel,
    setSpeed: setSpeedLevel,
    toggleShuffle,
    toggleRepeat,
    
    // Cleanup
    cleanup,
  };
};