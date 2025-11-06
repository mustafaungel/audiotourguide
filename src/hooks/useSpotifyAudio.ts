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
  const [isBuffering, setIsBuffering] = useState(false);
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

  // Load resume position from localStorage
  useEffect(() => {
    const savedPosition = localStorage.getItem(`audio-resume-${guideId}`);
    if (savedPosition) {
      const { time, section } = JSON.parse(savedPosition);
      setCurrentTime(time);
      setCurrentSection(section);
    }
  }, [guideId]);

  // Save position to localStorage
  useEffect(() => {
    if (currentTime > 0 && duration > 0) {
      localStorage.setItem(`audio-resume-${guideId}`, JSON.stringify({
        time: currentTime,
        section: currentSection
      }));
    }
  }, [currentTime, currentSection, guideId, duration]);

  const loadAudioSource = async (sectionIndex?: number) => {
    try {
      setLoading(true);
      console.log('[AUDIO] Loading audio source:', { guideId, sectionIndex, hasMainUrl: !!mainAudioUrl });
      
      let audioUrl = mainAudioUrl;
      
      // If we have sections and a specific section is requested
      if (sections.length > 0 && sectionIndex !== undefined && sections[sectionIndex]?.audio_url) {
        audioUrl = sections[sectionIndex].audio_url;
      }
      
      if (audioUrl) {
        console.log('[AUDIO] Using provided audio URL:', audioUrl.substring(0, 50) + '...');
        setAudioSrc(audioUrl);
        return audioUrl;
      }
      
      // Try to get audio from Supabase storage
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

  const setupAudioElement = useCallback((audio: HTMLAudioElement) => {
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
      audio.playbackRate = playbackSpeed;
      audio.volume = volume;
      setIsBuffering(false);
    });
    
    audio.addEventListener('waiting', () => {
      setIsBuffering(true);
    });
    
    audio.addEventListener('canplay', () => {
      setIsBuffering(false);
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
      setIsBuffering(false);
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
      setIsBuffering(true);
      const targetSection = sectionIndex ?? currentSection;
      
      if (!audioRef.current) {
        const audio = new Audio();
        audioRef.current = audio;
        setupAudioElement(audio);
      }

      // Load audio source if needed and store in local variable
      let currentAudioSrc = audioSrc;
      if (!audioSrc || sectionIndex !== undefined) {
        const src = await loadAudioSource(targetSection);
        if (!src) {
          setIsBuffering(false);
          return;
        }
        currentAudioSrc = src; // Use freshly loaded src immediately
      }

      if (audioRef.current && currentAudioSrc) {
        audioRef.current.src = currentAudioSrc;
        audioRef.current.volume = volume;
        audioRef.current.playbackRate = playbackSpeed;
        
        // Resume from saved position if available
        const savedPosition = localStorage.getItem(`audio-resume-${guideId}`);
        if (savedPosition && sectionIndex === undefined) {
          const { time, section } = JSON.parse(savedPosition);
          if (section === targetSection && time > 0) {
            audioRef.current.currentTime = time;
          }
        }
        
        // If playing a specific section with start time
        if (sections[targetSection]?.start_time) {
          audioRef.current.currentTime = sections[targetSection].start_time!;
        }
        
        await audioRef.current.play();
        setIsPlaying(true);
        setCurrentSection(targetSection);
        setIsBuffering(false);
        
        // Update MediaSession metadata
        updateMediaSession(targetSection);
        
        const sectionTitle = sections[targetSection]?.title || title;
        toast({
          title: 'Now Playing',
          description: sectionTitle,
        });
      }
    } catch (error) {
      console.error('Play error:', error);
      setIsBuffering(false);
      toast({
        title: 'Playback Error',
        description: 'Failed to start playback',
        variant: 'destructive',
      });
    }
  };

  // MediaSession API integration
  const updateMediaSession = (sectionIndex: number) => {
    if ('mediaSession' in navigator) {
      const sectionTitle = sections[sectionIndex]?.title || title;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: sectionTitle,
        artist: 'Audio Guide',
        album: title,
      });

      navigator.mediaSession.setActionHandler('play', () => play());
      navigator.mediaSession.setActionHandler('pause', () => pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => previousSection());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextSection());
      navigator.mediaSession.setActionHandler('seekbackward', () => skip(-10));
      navigator.mediaSession.setActionHandler('seekforward', () => skip(10));
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime) {
          seek(details.seekTime);
        }
      });
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
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
    // Clear MediaSession
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
    }
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
    isBuffering,
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