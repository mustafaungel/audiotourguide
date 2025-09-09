import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, ChevronDown, ChevronUp, List, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Section {
  id?: string;
  title: string;
  description?: string;
  audio_url?: string;
  duration_seconds?: number;
  order_index?: number;
  timestamp?: number;
  start_time?: number;
}

interface EnhancedAudioPlayerProps {
  guideId: string;
  guideTitle: string;
  sections: Section[];
  mainAudioUrl?: string;
  accessCode?: string;
  isPurchased?: boolean;
}

export const EnhancedAudioPlayer: React.FC<EnhancedAudioPlayerProps> = ({
  guideId,
  guideTitle,
  sections,
  mainAudioUrl,
  accessCode,
  isPurchased = false
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [chapterMarkers, setChapterMarkers] = useState<{position: number, title: string}[]>([]);
  
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
      const fallbackUrl = `/tmp/${guideId}.mp3`;
      return fallbackUrl;
    }
    
    try {
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

  const generateChapterMarkers = () => {
    if (audioMode === 'main' && sections.length > 0 && duration > 0) {
      const markers = sections.map((section, index) => {
        const timestamp = section.timestamp || section.start_time || (duration / sections.length) * index;
        return {
          position: (timestamp / duration) * 100,
          title: section.title
        };
      });
      setChapterMarkers(markers);
    }
  };

  const getCurrentChapterFromTime = (time: number) => {
    if (audioMode === 'sections') return currentSectionIndex;
    
    for (let i = sections.length - 1; i >= 0; i--) {
      const chapterTime = sections[i].timestamp || sections[i].start_time || 0;
      if (time >= chapterTime) {
        return i;
      }
    }
    return 0;
  };

  const setupAudioElement = (audioElement: HTMLAudioElement) => {
    audioElement.addEventListener('timeupdate', () => {
      const time = audioElement.currentTime;
      setCurrentTime(time);
      
      // Auto-update current chapter for main audio mode
      if (audioMode === 'main') {
        const newChapterIndex = getCurrentChapterFromTime(time);
        if (newChapterIndex !== currentSectionIndex) {
          setCurrentSectionIndex(newChapterIndex);
        }
      }
    });
    
    audioElement.addEventListener('loadedmetadata', () => {
      setDuration(audioElement.duration);
      generateChapterMarkers();
    });
    
    audioElement.addEventListener('ended', () => {
      setIsPlaying(false);
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
    
    if (sectionIndex === currentSectionIndex && isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      return;
    }
    
    setLoading(true);
    setCurrentSectionIndex(sectionIndex);
    
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioMode === 'sections') {
          audioRef.current.src = '';
        }
      }

      let audioUrl: string;
      
      if (audioMode === 'sections') {
        const section = sections[sectionIndex];
        audioUrl = await loadAudioSource(section.audio_url);
        
        if (!audioRef.current) {
          audioRef.current = new Audio();
          setupAudioElement(audioRef.current);
        }
        audioRef.current.src = audioUrl;
      } else {
        // For main audio, seek to chapter timestamp
        audioUrl = await loadAudioSource(mainAudioUrl);
        
        if (!audioRef.current || audioRef.current.src !== audioUrl) {
          if (!audioRef.current) {
            audioRef.current = new Audio();
            setupAudioElement(audioRef.current);
          }
          audioRef.current.src = audioUrl;
          
          // Wait for metadata to load before seeking
          await new Promise((resolve) => {
            if (audioRef.current?.readyState >= 1) {
              resolve(null);
            } else {
              audioRef.current?.addEventListener('loadedmetadata', resolve, { once: true });
            }
          });
        }
        
        const chapterTime = sections[sectionIndex].timestamp || sections[sectionIndex].start_time || 0;
        audioRef.current.currentTime = chapterTime;
      }

      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackSpeed;
      
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
    } else if (audioRef.current && audioMode === 'main') {
      audioRef.current.currentTime = 0;
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

  const jumpToChapter = (chapterIndex: number) => {
    playSection(chapterIndex);
    setShowChapters(false);
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
      setVolume(0.8);
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = 0.8;
    } else {
      setVolume(0);
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
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

  useEffect(() => {
    generateChapterMarkers();
  }, [duration, sections, audioMode]);

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
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              {audioMode === 'sections' ? 'Audio Chapters' : 'Audio Guide'}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowChapters(!showChapters)}
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              Chapters
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Current Section Info */}
          <div className="text-center space-y-3">
            <div className="space-y-1">
              <h3 className="font-semibold text-xl leading-tight">
                {currentSection?.title || guideTitle}
              </h3>
              {currentSection?.description && (
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {currentSection.description}
                </p>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                Chapter {currentSectionIndex + 1} of {sections.length}
              </span>
              {currentSection?.duration_seconds && (
                <span>{formatTime(currentSection.duration_seconds)}</span>
              )}
            </div>
          </div>

          {/* Progress Bar with Chapter Markers */}
          <div className="space-y-3">
            <div className="relative">
              <Slider
                value={[progress]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="w-full"
              />
              {/* Chapter markers on progress bar */}
              {chapterMarkers.map((marker, index) => (
                <button
                  key={index}
                  onClick={() => jumpToChapter(index)}
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary/70 rounded-full border-2 border-background hover:bg-primary hover:scale-110 transition-all"
                  style={{ left: `${marker.position}%` }}
                  title={`Jump to: ${marker.title}`}
                />
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(-15)}
              disabled={loading}
              className="h-12 w-12 rounded-full hover:bg-primary/10"
              title="Skip back 15 seconds"
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={previousSection}
              disabled={loading || currentSectionIndex === 0}
              className="h-14 w-14 rounded-full hover:bg-primary/10"
              title="Previous chapter"
            >
              <SkipBack className="h-6 w-6" />
            </Button>
            
            <Button
              onClick={togglePlayPause}
              disabled={loading}
              size="lg"
              className="h-20 w-20 rounded-full bg-gradient-primary hover:bg-gradient-primary/90 shadow-elegant"
            >
              {loading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={nextSection}
              disabled={loading || currentSectionIndex === sections.length - 1}
              className="h-14 w-14 rounded-full hover:bg-primary/10"
              title="Next chapter"
            >
              <SkipForward className="h-6 w-6" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => skip(15)}
              disabled={loading}
              className="h-12 w-12 rounded-full hover:bg-primary/10"
              title="Skip forward 15 seconds"
            >
              <SkipForward className="h-5 w-5" />
            </Button>
          </div>

          {/* Quick Controls Row */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="flex items-center gap-2"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <span className="text-sm">{Math.round(volume * 100)}%</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2"
            >
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              <span className="text-sm">{playbackSpeed}x Speed</span>
            </Button>
          </div>

          {/* Advanced Controls */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleContent className="space-y-4 pt-4 border-t">
              {/* Speed Controls */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-center">Playback Speed</p>
                <div className="grid grid-cols-6 gap-2">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                    <Button
                      key={speed}
                      variant={playbackSpeed === speed ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSpeedChange(speed)}
                      className="h-10 text-sm"
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </div>

              {/* Volume Control */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-center">Volume Control</p>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="h-10 w-10 flex-shrink-0"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <Slider
                      value={[volume * 100]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Collapsible Chapter List */}
      <Collapsible open={showChapters} onOpenChange={setShowChapters}>
        <CollapsibleContent>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <List className="h-4 w-4" />
                All Chapters ({sections.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sections.map((section, index) => (
                  <button
                    key={index}
                    onClick={() => jumpToChapter(index)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg transition-all ${
                      index === currentSectionIndex
                        ? 'bg-gradient-primary text-primary-foreground shadow-elegant'
                        : 'bg-muted/50 hover:bg-muted hover:shadow-md'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === currentSectionIndex
                        ? 'bg-white/20 text-inherit'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {index === currentSectionIndex && isPlaying ? (
                        <div className="flex gap-1">
                          <div className="w-1 h-4 bg-current animate-pulse rounded-full" />
                          <div className="w-1 h-4 bg-current animate-pulse rounded-full animation-delay-100" />
                          <div className="w-1 h-4 bg-current animate-pulse rounded-full animation-delay-200" />
                        </div>
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="flex-1 text-left space-y-1">
                      <h4 className="font-semibold text-base">{section.title}</h4>
                      {section.description && (
                        <p className={`text-sm line-clamp-2 ${
                          index === currentSectionIndex 
                            ? 'text-primary-foreground/80' 
                            : 'text-muted-foreground'
                        }`}>
                          {section.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {section.duration_seconds && (
                        <span className={`text-sm font-medium ${
                          index === currentSectionIndex 
                            ? 'text-primary-foreground/90' 
                            : 'text-muted-foreground'
                        }`}>
                          {formatTime(section.duration_seconds)}
                        </span>
                      )}
                      <Play className={`h-4 w-4 ${
                        index === currentSectionIndex 
                          ? 'text-primary-foreground/70' 
                          : 'text-muted-foreground'
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};