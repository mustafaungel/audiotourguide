import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { t } from '@/lib/translations';

// Spotify/Apple Music style lyrics view
const ScriptLyricsView: React.FC<{ scriptText: string; currentTime: number; duration: number; isPlaying: boolean }> = ({ scriptText, currentTime, duration }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolling = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();

  // Split by paragraphs (natural text breaks) for clean, uniform blocks
  const lines = useMemo(() => {
    if (!scriptText || duration <= 0) return [];

    const paragraphs = scriptText
      .split(/\n\n+/)
      .map(p => p.replace(/\n/g, ' ').trim())
      .filter(p => p.length > 20);

    if (paragraphs.length === 0) return [];

    const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0);
    let cumChars = 0;
    return paragraphs.map(text => {
      const startPct = cumChars / totalChars;
      cumChars += text.length;
      return { text, startTime: startPct * duration };
    });
  }, [scriptText, duration]);

  const activeIdx = useMemo(() => {
    if (duration <= 0) return 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].startTime) return i;
    }
    return 0;
  }, [currentTime, lines, duration]);

  // Auto-scroll to active, but pause if user is manually scrolling
  useEffect(() => {
    if (userScrolling.current || !containerRef.current) return;
    const el = containerRef.current.querySelector(`[data-line="${activeIdx}"]`) as HTMLElement;
    if (el) {
      const container = containerRef.current;
      const target = el.offsetTop - container.clientHeight * 0.3;
      container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    }
  }, [activeIdx]);

  const handleUserScroll = () => {
    userScrolling.current = true;
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => { userScrolling.current = false; }, 4000);
  };

  return (
    <div className="h-full relative">
      {/* Scrollable script area — user CAN scroll freely */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-contain"
        onTouchStart={handleUserScroll}
        onTouchEnd={() => { scrollTimer.current = setTimeout(() => { userScrolling.current = false; }, 4000); }}
      >
        <div className="px-6 pt-6 pb-8 max-w-md mx-auto">
          {lines.map((line, i) => {
            const isActive = i === activeIdx;
            const absDist = Math.abs(i - activeIdx);
            const opacity = isActive ? 1 : Math.max(0.2, 0.55 - absDist * 0.1);

            return (
              <p
                key={i}
                data-line={i}
                className={cn(
                  "mb-5 font-semibold text-center",
                  "transition-[opacity,transform,color] duration-700 ease-out",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                style={{
                  fontSize: isActive ? '17px' : '15px',
                  lineHeight: '1.75',
                  opacity,
                  transform: isActive ? 'translateY(0)' : `translateY(${i > activeIdx ? '4px' : '-2px'})`,
                }}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      </div>
      {/* Gradient fades */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-background/90 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background/90 to-transparent pointer-events-none z-10" />
    </div>
  );
};

interface ExpandedPlayerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  guideTitle: string;
  chapterIndex: number;
  totalChapters: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  loading?: boolean;
  imageUrl?: string;
  scriptText?: string;
  playbackSpeed: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onTogglePlay: () => void;
  onSeek: (value: number[]) => void;
  onSkip: (seconds: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSpeedChange: (speed: number) => void;
  autoAdvance?: boolean;
  onToggleAutoAdvance?: () => void;
  lang?: string;
}

export const ExpandedPlayer: React.FC<ExpandedPlayerProps> = ({
  open,
  onClose,
  title,
  guideTitle,
  chapterIndex,
  totalChapters,
  currentTime,
  duration,
  isPlaying,
  loading,
  imageUrl,
  scriptText,
  playbackSpeed,
  canGoNext,
  canGoPrevious,
  onTogglePlay,
  onSeek,
  onSkip,
  onPrevious,
  onNext,
  onSpeedChange,
  autoAdvance,
  onToggleAutoAdvance,
  lang = 'en',
}) => {
  const [showSpeedSheet, setShowSpeedSheet] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStartRef = useRef(0);
  const [shouldRender, setShouldRender] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      document.body.style.overflow = '';
      setDragY(0);
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!shouldRender) return null;

  const content = (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-background flex flex-col",
          dragY > 0 ? "" : "transition-all duration-300 ease-out",
          isVisible ? "opacity-100" : "opacity-0 translate-y-full"
        )}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, opacity: Math.max(0.3, 1 - dragY / 400) } : undefined}
        onTouchStart={(e) => { dragStartRef.current = e.touches[0].clientY; }}
        onTouchMove={(e) => {
          const diff = e.touches[0].clientY - dragStartRef.current;
          if (diff > 0) setDragY(diff);
        }}
        onTouchEnd={() => {
          if (dragY > 120) { onClose(); }
          setDragY(0);
        }}
      >
        {/* Blurred background image - theme aware */}
        {imageUrl && (
          <>
            <div
              className="absolute inset-0 scale-125 will-change-transform"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(25px) saturate(1.6)',
                opacity: 0.45,
              }}
            />
            {/* Light mode: lighter overlay. Dark mode: darker overlay */}
            <div className="absolute inset-0 bg-background/50 dark:bg-background/65" />
          </>
        )}
        {!imageUrl && <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/5" />}

        {/* Content */}
        <div className="relative flex flex-col h-full safe-area-top safe-area-bottom">
          {/* Drag indicator */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          {/* Header — collapse button */}
          <div className="flex items-center justify-between px-4 pb-2">
            <button
              onClick={() => { haptics.light(); onClose(); }}
              className="w-10 h-10 flex items-center justify-center text-muted-foreground active:opacity-60"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('nowPlaying', lang)}
            </span>
            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Script Lyrics View (Spotify-style with paragraph tracking) */}
          <div className="flex-1 relative overflow-hidden px-6 py-4">
            {scriptText ? (
              <ScriptLyricsView scriptText={scriptText} currentTime={currentTime} duration={duration} isPlaying={isPlaying} />
            ) : imageUrl ? (
              <div className="h-full flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full max-w-[280px] aspect-square rounded-2xl object-cover shadow-2xl ring-1 ring-border/10"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/hero-audio-guide.jpg'; }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="w-full max-w-[280px] aspect-square rounded-2xl bg-muted/30 flex items-center justify-center">
                  <Play className="w-16 h-16 text-muted-foreground/30" />
                </div>
              </div>
            )}
          </div>

          {/* Track info */}
          <div className="px-6 pb-2 text-center">
            <h2 className="text-lg font-bold text-foreground line-clamp-2">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {chapterIndex + 1} / {totalChapters} • {guideTitle}
            </p>
          </div>

          {/* Seek slider */}
          <div className="px-6 pb-2">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={onSeek}
              className="w-full"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(currentTime)}</span>
              <span className="text-[11px] text-muted-foreground tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div className="flex items-center justify-center gap-6 px-6 pb-4">
            {/* Skip -15 */}
            <button
              onClick={() => { haptics.light(); onSkip(-15); }}
              className="w-12 h-12 flex items-center justify-center text-foreground active:scale-90 transition-transform"
            >
              <span className="text-xs font-bold">-15</span>
            </button>

            {/* Previous */}
            <button
              onClick={() => { haptics.light(); onPrevious(); }}
              disabled={!canGoPrevious}
              className="w-12 h-12 flex items-center justify-center text-foreground disabled:opacity-30 active:scale-90 transition-transform"
            >
              <SkipBack className="w-6 h-6" fill="currentColor" />
            </button>

            {/* Play/Pause — large */}
            <button
              onClick={() => { haptics.medium(); onTogglePlay(); }}
              disabled={loading}
              className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-90",
                "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
              )}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" fill="currentColor" />
              ) : (
                <Play className="w-7 h-7 ml-1" fill="currentColor" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={() => { haptics.light(); onNext(); }}
              disabled={!canGoNext}
              className="w-12 h-12 flex items-center justify-center text-foreground disabled:opacity-30 active:scale-90 transition-transform"
            >
              <SkipForward className="w-6 h-6" fill="currentColor" />
            </button>

            {/* Skip +15 */}
            <button
              onClick={() => { haptics.light(); onSkip(15); }}
              className="w-12 h-12 flex items-center justify-center text-foreground active:scale-90 transition-transform"
            >
              <span className="text-xs font-bold">+15</span>
            </button>
          </div>

          {/* Speed control */}
          <div className="flex justify-center gap-3 pb-6">
            <button
              onClick={() => { haptics.medium(); setShowSpeedSheet(true); }}
              className="px-4 py-2 rounded-full bg-muted/50 text-sm font-semibold text-foreground active:scale-95 transition-transform"
            >
              {playbackSpeed === 1.0 ? t('normal', lang) : `${playbackSpeed}×`}
            </button>
            {onToggleAutoAdvance && (
              <button
                onClick={() => { haptics.light(); onToggleAutoAdvance(); }}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold active:scale-95 transition-all",
                  autoAdvance ? "bg-primary/15 text-primary" : "bg-muted/50 text-muted-foreground"
                )}
              >
                Auto ▶
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Speed bottom sheet */}
      <BottomSheet
        open={showSpeedSheet}
        onOpenChange={setShowSpeedSheet}
        title={t('playbackSpeed', lang)}
        defaultSnap="mini"
      >
        <div className="pb-6 space-y-1">
          {speedOptions.map((speed) => (
            <button
              key={speed}
              onClick={() => {
                haptics.selection();
                onSpeedChange(speed);
                setTimeout(() => setShowSpeedSheet(false), 200);
              }}
              className={cn(
                "w-full h-12 flex items-center justify-center rounded-lg transition-all touch-manipulation",
                playbackSpeed === speed ? "font-bold text-primary scale-105" : "text-muted-foreground"
              )}
            >
              <span className={cn("text-base", playbackSpeed === speed && "text-lg font-semibold")}>
                {speed === 1.0 ? t('normal', lang) : `${speed}×`}
              </span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );

  return createPortal(content, document.body);
};
