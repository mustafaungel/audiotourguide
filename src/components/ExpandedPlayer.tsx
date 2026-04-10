import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, SkipBack, SkipForward, ChevronDown, X } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
// BottomSheet removed - using inline speed picker (z-index conflict with expanded player)
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { t } from '@/lib/translations';

// Apple Music style lyrics view — blur-to-clear animation following audio
const ScriptLyricsView: React.FC<{ scriptText: string; currentTime: number; duration: number; isPlaying: boolean }> = ({ scriptText, currentTime, duration, isPlaying }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolling = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();
  const rafRef = useRef<number>(0);
  const isAutoScrolling = useRef(false);
  const lastActiveIdx = useRef(-1);

  // Split by paragraphs, map each to a start time based on character ratio
  const lines = useMemo(() => {
    if (!scriptText || duration <= 0) return [];

    const paragraphs = scriptText
      .split(/\n\n+/)
      .map(p => p.replace(/\n/g, ' ').trim())
      .filter(p => p.length > 20);

    if (paragraphs.length === 0) return [];

    const totalChars = paragraphs.reduce((sum, p) => sum + p.length, 0);
    let cumChars = 0;
    return paragraphs.map((text) => {
      const startTime = (cumChars / totalChars) * duration;
      cumChars += text.length;
      const endTime = (cumChars / totalChars) * duration;
      return { text, startTime, endTime };
    });
  }, [scriptText, duration]);

  const activeIdx = useMemo(() => {
    if (duration <= 0) return 0;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (currentTime >= lines[i].startTime) return i;
    }
    return 0;
  }, [currentTime, lines, duration]);

  // Detect user scroll via scroll event (not touch — touch fires on every tap)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      if (isAutoScrolling.current) return; // ignore our own scroll
      userScrolling.current = true;
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => { userScrolling.current = false; }, 5000);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Smooth auto-scroll using rAF — triggers on activeIdx change
  useEffect(() => {
    if (userScrolling.current || !containerRef.current) return;
    if (activeIdx === lastActiveIdx.current) return;
    lastActiveIdx.current = activeIdx;

    const el = containerRef.current.querySelector(`[data-line="${activeIdx}"]`) as HTMLElement;
    if (!el) return;

    const container = containerRef.current;
    const targetTop = el.offsetTop - container.clientHeight * 0.3;
    const scrollTarget = Math.max(0, targetTop);
    const startScroll = container.scrollTop;
    const diff = scrollTarget - startScroll;
    if (Math.abs(diff) < 3) return;

    // Longer duration for smoother feel, proportional to distance
    const animDuration = Math.min(1200, Math.max(400, Math.abs(diff) * 2));
    let animStart: number | null = null;

    cancelAnimationFrame(rafRef.current);
    isAutoScrolling.current = true;

    const animate = (timestamp: number) => {
      if (!animStart) animStart = timestamp;
      const elapsed = timestamp - animStart;
      const progress = Math.min(1, elapsed / animDuration);
      // Ease-in-out cubic for smooth start and stop
      const eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      container.scrollTop = startScroll + diff * eased;
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        isAutoScrolling.current = false;
      }
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => { cancelAnimationFrame(rafRef.current); isAutoScrolling.current = false; };
  }, [activeIdx]);

  // Calculate blur + opacity for each paragraph based on time distance
  const getLineStyle = (index: number) => {
    const line = lines[index];
    if (!line) return {};

    const isActive = index === activeIdx;
    const isPast = index < activeIdx;
    const timeDiff = line.startTime - currentTime; // positive = future, negative = past
    const idxDist = Math.abs(index - activeIdx);

    let blur: number;
    let opacity: number;
    let scale: number;

    if (isActive) {
      blur = 0;
      opacity = 1;
      scale = 1.015;
    } else if (isPast) {
      // Past — clear but faded, more distant = more faded
      blur = 0;
      opacity = Math.max(0.15, 0.35 - idxDist * 0.06);
      scale = 0.99;
    } else {
      // Future — blur increases with distance, gradual reveal as audio approaches
      // Use both index distance AND time distance for robust blur
      const idxBlur = Math.min(5, idxDist * 1.8);
      const timeBlur = Math.min(5, Math.max(0, timeDiff * 0.25));
      blur = Math.max(idxBlur, timeBlur);
      // Opacity: close future = semi-visible, far future = barely visible
      opacity = Math.max(0.08, Math.min(0.5, 0.6 - idxDist * 0.12));
      scale = 0.99;
    }

    const filterValue = blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : 'none';

    return {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: isActive ? '16px' : '14.5px',
      lineHeight: '2.15',
      letterSpacing: '0.01em',
      opacity,
      filter: filterValue,
      WebkitFilter: filterValue, // Safari support
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
    };
  };

  return (
    <div className="h-full relative">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto overscroll-contain"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Top spacer so first paragraph can scroll to center */}
        <div className="h-[35vh]" />
        <div className="px-6 pb-8 max-w-md mx-auto">
          {lines.map((line, i) => {
            const isActive = i === activeIdx;
            const isPast = i < activeIdx;
            return (
              <p
                key={i}
                data-line={i}
                className={cn(
                  "mb-7 text-center",
                  "transition-[filter,opacity,transform] duration-[800ms] ease-out",
                  isActive
                    ? "text-foreground dark:text-white font-semibold"
                    : isPast
                      ? "text-foreground/30 dark:text-white/20 font-normal"
                      : "text-foreground/45 dark:text-white/35 font-normal"
                )}
                style={getLineStyle(i)}
              >
                {line.text}
              </p>
            );
          })}
        </div>
        {/* Bottom spacer so last paragraph can scroll to center */}
        <div className="h-[40vh]" />
      </div>
      {/* Gradient fades — strong edges for polished look */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />
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
  const [showSpeedPicker, setShowSpeedPicker] = useState(false);
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
                filter: 'blur(25px) saturate(1.4)',
                opacity: 0.3,
              }}
            />
            {/* Light: strong white overlay for readability. Dark: strong dark overlay */}
            <div className="absolute inset-0 bg-background/75 dark:bg-background/70" />
          </>
        )}
        {!imageUrl && <div className="absolute inset-0 bg-background" />}

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

          {/* Speed + Auto controls */}
          <div className="flex justify-center items-center gap-3 pb-6">
            {/* Speed - tap to cycle */}
            <button
              onClick={() => {
                haptics.selection();
                const idx = speedOptions.indexOf(playbackSpeed);
                onSpeedChange(speedOptions[(idx + 1) % speedOptions.length]);
              }}
              className="h-10 min-w-[72px] px-4 rounded-full bg-foreground/10 backdrop-blur-sm border border-foreground/10 flex items-center justify-center gap-1.5 active:scale-95 active:bg-foreground/20 transition-all"
            >
              <span className="text-sm font-bold text-foreground tabular-nums">
                {playbackSpeed}×
              </span>
            </button>

            {/* Auto-advance toggle */}
            {onToggleAutoAdvance && (
              <button
                onClick={() => { haptics.medium(); onToggleAutoAdvance(); }}
                className={cn(
                  "h-10 px-5 rounded-full flex items-center gap-2 active:scale-95 transition-colors duration-200 border",
                  autoAdvance
                    ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/30"
                    : "bg-foreground/10 border-foreground/10 text-muted-foreground"
                )}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M5 4l10 8-10 8V4zM17 4h2v16h-2V4z"/>
                </svg>
                <span className="text-sm font-bold">{t('autoPlay', lang) || 'Autoplay'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* No backdrop needed - speed is now tap-to-cycle */}
    </>
  );

  return createPortal(content, document.body);
};
