import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, X, CreditCard } from 'lucide-react';

interface DemoAudioPlayerProps {
  guide: {
    id: string;
    title: string;
    audio_url?: string;
    demoLength?: number;
  };
  onClose: () => void;
  onPurchase: () => void;
}

export const DemoAudioPlayer: React.FC<DemoAudioPlayerProps> = ({
  guide,
  onClose,
  onPurchase
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [demoEnded, setDemoEnded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const demoLength = guide.demoLength || 30; // 30 seconds default

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      
      // Stop at demo length
      if (audio.currentTime >= demoLength) {
        audio.pause();
        setIsPlaying(false);
        setDemoEnded(true);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setDemoEnded(true);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [demoLength]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      // Reset if demo ended
      if (demoEnded) {
        audio.currentTime = 0;
        setCurrentTime(0);
        setDemoEnded(false);
      }
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const progress = (currentTime / demoLength) * 100;
  const timeLeft = Math.max(0, demoLength - currentTime);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Demo Preview</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-medium mb-2">{guide.title}</h4>
              <p className="text-sm text-muted-foreground">
                {demoEnded ? 'Demo completed!' : `${Math.ceil(timeLeft)}s remaining`}
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.floor(currentTime)}s</span>
                <span>{demoLength}s</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={togglePlay}
                disabled={demoEnded}
                className="w-20"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Volume2 className="w-5 h-5 text-muted-foreground" />
            </div>

            {demoEnded && (
              <div className="text-center space-y-3 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Liked what you heard? Get the full experience!
                </p>
                <Button onClick={onPurchase} className="w-full" size="lg">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Purchase Full Guide
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setDemoEnded(false);
                    setCurrentTime(0);
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0;
                    }
                  }}
                  className="w-full"
                >
                  Play Demo Again
                </Button>
              </div>
            )}
          </div>

          <audio
            ref={audioRef}
            src={guide.audio_url}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        </CardContent>
      </Card>
    </div>
  );
};