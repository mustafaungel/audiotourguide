import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Section {
  id?: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
  order_index?: number;
}

interface SectionAudioPlayerProps {
  guideId: string;
  guideTitle: string;
  sections: Section[];
  mainAudioUrl?: string;
}

export const SectionAudioPlayer: React.FC<SectionAudioPlayerProps> = ({
  guideId,
  guideTitle,
  sections,
  mainAudioUrl
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Determine if we have section-based audio or main audio
  const hasIndividualSections = sections.some(section => section.audio_url);
  const audioMode = hasIndividualSections ? 'sections' : 'main';
  
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadAudioSource = async (audioUrl?: string) => {
    if (!audioUrl) {
      // Try fallback sources
      const fallbackUrl = `/tmp/${guideId}.mp3`;
      return fallbackUrl;
    }
    
    try {
      // If it's a section audio URL, try to get signed URL from storage
      if (audioUrl && !audioUrl.startsWith('http')) {
        const { data: urlData } = await supabase.storage
          .from('guide-audio')
          .createSignedUrl(audioUrl, 3600);
        
        if (urlData?.signedUrl) {
          return urlData.signedUrl;
        }
      }
      
      return audioUrl;
    } catch (error) {
      console.error('Error loading audio source:', error);
      return audioUrl;
    }
  };

  const setupAudioElement = (audioElement: HTMLAudioElement) => {
    audioElement.addEventListener('timeupdate', () => {
      setCurrentTime(audioElement.currentTime);
    });
    
    audioElement.addEventListener('loadedmetadata', () => {
      setDuration(audioElement.duration);
    });
    
    audioElement.addEventListener('ended', () => {
      setIsPlaying(false);
      // Auto-advance to next section if available
      if (audioMode === 'sections' && currentSectionIndex < sections.length - 1) {
        setTimeout(() => {
          playSection(currentSectionIndex + 1);
        }, 1000);
      }
    });
    
    audioElement.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      toast({
        title: 'Playback Error',
        description: 'Failed to play audio file',
        variant: 'destructive',
      });
      setIsPlaying(false);
      setLoading(false);
    });
  };

  const playSection = async (sectionIndex: number) => {
    if (sectionIndex < 0 || sectionIndex >= sections.length) return;
    
    setLoading(true);
    setCurrentSectionIndex(sectionIndex);
    
    try {
      // Stop current audio if playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      let audioUrl: string;
      
      if (audioMode === 'sections') {
        const section = sections[sectionIndex];
        audioUrl = await loadAudioSource(section.audio_url);
      } else {
        audioUrl = await loadAudioSource(mainAudioUrl);
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
        setupAudioElement(audioRef.current);
      }

      audioRef.current.src = audioUrl;
      audioRef.current.volume = volume;
      
      await audioRef.current.play();
      setIsPlaying(true);
      
      toast({
        title: 'Now Playing',
        description: sections[sectionIndex]?.title || guideTitle,
      });
      
    } catch (error) {
      console.error('Play error:', error);
      toast({
        title: 'Playback Error',
        description: 'Failed to start playback',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || !sections.length) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src) {
        await playSection(currentSectionIndex);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const previousSection = () => {
    if (currentSectionIndex > 0) {
      playSection(currentSectionIndex - 1);
    }
  };

  const nextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      playSection(currentSectionIndex + 1);
    }
  };

  const handleSeek = (newProgress: number[]) => {
    if (audioRef.current) {
      const newTime = (newProgress[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0] / 100;
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(0.5);
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = 0.5;
    } else {
      setVolume(0);
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  if (!sections.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No audio content available for this guide.</p>
        </CardContent>
      </Card>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentSection = sections[currentSectionIndex];

  return (
    <div className="space-y-4">
      {/* Main Player Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {audioMode === 'sections' ? 'Audio Chapters' : 'Audio Guide'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Current Section Info */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">
              {currentSection?.title || guideTitle}
            </h3>
            {currentSection?.description && (
              <p className="text-sm text-muted-foreground">
                {currentSection.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Chapter {currentSectionIndex + 1} of {sections.length}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Slider
              value={[progress]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={previousSection}
              disabled={loading || currentSectionIndex === 0}
              className="h-14 w-14 min-h-[56px] touch-manipulation rounded-full"
              title="Previous chapter"
            >
              <SkipBack className="h-6 w-6" />
            </Button>
            
            <Button
              onClick={togglePlayPause}
              disabled={loading}
              size="lg"
              className="h-18 w-18 min-h-[72px] touch-manipulation rounded-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-lg"
            >
              {loading ? (
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-7 w-7" />
              ) : (
                <Play className="h-7 w-7 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSection}
              disabled={loading || currentSectionIndex === sections.length - 1}
              className="h-14 w-14 min-h-[56px] touch-manipulation rounded-full"
              title="Next chapter"
            >
              <SkipForward className="h-6 w-6" />
            </Button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="h-12 w-12 min-h-[48px] touch-manipulation flex-shrink-0"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
            <Slider
              value={[volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="flex-1 h-2 touch-manipulation"
            />
          </div>
        </CardContent>
      </Card>

      {/* Chapter List */}
      {audioMode === 'sections' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All Chapters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sections.map((section, index) => (
                <button
                  key={index}
                  onClick={() => playSection(index)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    index === currentSectionIndex
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === currentSectionIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {index === currentSectionIndex && isPlaying ? (
                        <div className="h-3 w-3 animate-pulse rounded-full bg-current" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <h4 className="font-medium">{section.title}</h4>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {section.duration_seconds && (
                      <span className="text-sm text-muted-foreground">
                        {formatTime(section.duration_seconds)}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};