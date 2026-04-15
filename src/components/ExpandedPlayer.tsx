import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, SkipBack, SkipForward, ChevronDown } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
// BottomSheet removed - using inline speed picker (z-index conflict with expanded player)
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { t } from '@/lib/translations';
import { ThemeToggle } from '@/components/ThemeToggle';

// Apple Music style lyrics view — paragraph-level tracking with audio
// Paragraphs = longer time windows (~20-30s each) = less drift & fewer misaligned transitions
const ScriptLyricsView: React.FC<{ scriptText: string; currentTime: number; duration: number; isPlaying: boolean }> = ({ scriptText, currentTime, duration }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const userScrolling = useRef(false);
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>();
  const rafRef = useRef<number>(0);
  const isAutoScrolling = useRef(false);
  const lastActiveIdx = useRef(-1);

  // Split into paragraphs — each paragraph is one tracking unit
  const paragraphs = useMemo(() => {
    if (!scriptText || duration <= 0) return [];

    // Split by double-newlines (paragraph breaks)
    const rawParagraphs = scriptText.split(/\n\n+/);
    const cleaned: string[] = [];

    for (const p of rawParagraphs) {
      const text = p.replace(/\n/g, ' ').trim();
      if (text.length >= 10) cleaned.push(text);
    }

    // If no paragraph breaks found (single block of text), split into ~3-4 chunks by sentences
    if (cleaned.length <= 1 && scriptText.length > 200) {
      const allText = scriptText.replace(/\n/g, ' ').trim();
      const sentences = allText.split(/(?<=[.!?。！？])\s+/).filter(s => s.trim().length > 5);
      if (sentences.length >= 4) {
        const chunkSize = Math.ceil(sentences.length / Math.min(5, Math.ceil(sentences.length / 3)));
        const chunks: string[] = [];
        for (let i = 0; i < sentences.length; i += chunkSize) {
          chunks.push(sentences.slice(i, i + chunkSize).join(' '));
        }
        if (chunks.length >= 2) return buildTimings(chunks, duration);
      }
    }

    if (cleaned.length === 0) return [];
    return buildTimings(cleaned, duration);
  }, [scriptText, duration]);

  // Active paragraph index based on currentTime
  const activeIdx = useMemo(() => {
    if (duration <= 0 || paragraphs.length === 0) return 0;
    for (let i = paragraphs.length - 1; i >= 0; i--) {
      if (currentTime >= paragraphs[i].startTime) return i;
    }
    return 0;
  }, [currentTime, paragraphs, duration]);

  // Reset all scroll state when script changes (new section loaded)
  useEffect(() => {
    userScrolling.current = false;
    isAutoScrolling.current = false;
    lastActiveIdx.current = -1;
    cancelAnimationFrame(rafRef.current);
    clearTimeout(scrollTimer.current);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [scriptText]);

  // Detect user scroll (ignore our own programmatic scrolls)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onScroll = () => {
      if (isAutoScrolling.current) return;
      userScrolling.current = true;
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => { userScrolling.current = false; }, 6000);
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Smooth auto-scroll — triggers on each paragraph change (less frequent than sentence-level)
  useEffect(() => {
    if (userScrolling.current || !containerRef.current) return;
    if (activeIdx === lastActiveIdx.current) return;
    lastActiveIdx.current = activeIdx;

    const el = containerRef.current.querySelector(`[data-para="${activeIdx}"]`) as HTMLElement;
    if (!el) return;

    const container = containerRef.current;
    const targetTop = el.offsetTop - container.clientHeight * 0.3;
    const scrollTarget = Math.max(0, targetTop);
    const startScroll = container.scrollTop;
    const diff = scrollTarget - startScroll;
    if (Math.abs(diff) < 2) return;

    // Gentle scroll — paragraphs change less often so we can take our time
    const animDuration = Math.min(2200, Math.max(1000, Math.abs(diff) * 3));
    let animStart: number | null = null;

    cancelAnimationFrame(rafRef.current);
    isAutoScrolling.current = true;

    const animate = (timestamp: number) => {
      if (!animStart) animStart = timestamp;
      const elapsed = timestamp - animStart;
      const progress = Math.min(1, elapsed / animDuration);
      const eased = -(Math.cos(Math.PI * progress) - 1) / 2;
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

  return (
    <div className="h-full relative">
      {/* Book page container */}
      <div
        className="absolute inset-2 inset-y-0 rounded-2xl bg-amber-50/80 dark:bg-stone-900/80 border-l border-amber-200/40 dark:border-stone-700/40"
        style={{
          boxShadow: 'inset 0 2px 12px rgba(0,0,0,0.05), inset 0 -2px 12px rgba(0,0,0,0.03), 0 4px 24px rgba(0,0,0,0.08)',
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(180,140,80,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(160,120,60,0.02) 0%, transparent 50%)',
        }}
      />

      {/* Paragraph counter — top right */}
      <div className="absolute top-3 right-5 z-20 transition-opacity duration-500">
        <span className="text-[11px] font-medium text-stone-400/70 dark:text-stone-500/60 font-sans tabular-nums">
          § {activeIdx + 1} / {paragraphs.length}
        </span>
      </div>

      <div
        ref={containerRef}
        className="relative h-full overflow-y-auto overscroll-contain script-scroll-container"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        {/* Top spacer */}
        <div className="h-[7vh]" />
        <div className="px-7 pb-8 max-w-lg mx-auto">
          {paragraphs.map((para, i) => {
            const isActive = i === activeIdx;
            const isPast = i < activeIdx;

            return (
              <div
                key={i}
                data-para={i}
                className={cn(
                  "relative mb-6 text-left rounded-lg",
                  "transition-[color,border-color,background,padding,font-size] duration-[1000ms] ease-in-out",
                  isActive
                    ? "text-stone-800 dark:text-amber-100 border-l-2 border-amber-400/60 dark:border-amber-500/40 pl-4 pr-3 py-3"
                    : "border-l-2 border-transparent pl-4 pr-3 py-1",
                  isPast && !isActive
                    ? "text-stone-600/80 dark:text-stone-400/60"
                    : !isActive
                      ? "text-stone-500/60 dark:text-stone-500/40"
                      : ""
                )}
                style={{
                  fontFamily: "'Lora', 'Playfair Display', Georgia, serif",
                  fontSize: isActive ? '16px' : '14.5px',
                  lineHeight: '2.0',
                  fontWeight: isActive ? 500 : 400,
                  letterSpacing: '0.02em',
                  // Highlighter marker effect on active paragraph
                  ...(isActive ? {
                    background: 'linear-gradient(to right, rgba(251,191,36,0.15) 0%, rgba(251,146,60,0.10) 50%, rgba(251,191,36,0.15) 100%)',
                    backgroundSize: '100% 2em',
                    backgroundPosition: '0 0.15em',
                  } : {}),
                }}
              >
                {para.text}
              </div>
            );
          })}
        </div>
        {/* Bottom spacer */}
        <div className="h-[20vh]" />
      </div>

      {/* Gradient fades — paper-tinted */}
      <div className="absolute top-0 left-2 right-2 h-28 rounded-t-2xl bg-gradient-to-b from-amber-50/90 dark:from-stone-900/90 via-amber-50/50 dark:via-stone-900/50 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-2 right-2 h-24 rounded-b-2xl bg-gradient-to-t from-amber-50/90 dark:from-stone-900/90 via-amber-50/50 dark:via-stone-900/50 to-transparent pointer-events-none z-10" />
    </div>
  );
};

// Build paragraph timing weights — word-count proportional with punctuation pauses
function buildTimings(texts: string[], duration: number) {
  const PARA_GAP = 4;         // word-equivalents for inter-paragraph pause
  const COMMA_WEIGHT = 0.3;
  const PERIOD_WEIGHT = 0.5;
  const TRACKING_DELAY = 0.8; // seconds — tracker stays slightly behind audio

  const getWeight = (text: string) => {
    const words = text.split(/\s+/).length;
    const commas = (text.match(/[,;:]/g) || []).length;
    const periods = (text.match(/[.!?。！？]/g) || []).length;
    return words + commas * COMMA_WEIGHT + periods * PERIOD_WEIGHT;
  };

  const weights = texts.map(t => getWeight(t));
  const totalWeight = weights.reduce((a, b) => a + b, 0) + PARA_GAP * (texts.length - 1);

  let cumWeight = 0;
  return texts.map((text, i) => {
    if (i > 0) cumWeight += PARA_GAP;
    const startTime = Math.min(duration, (cumWeight / totalWeight) * duration + TRACKING_DELAY);
    cumWeight += weights[i];
    const endTime = Math.min(duration, (cumWeight / totalWeight) * duration + TRACKING_DELAY);
    return { text, startTime, endTime };
  });
}

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
  const dragAllowed = useRef(false);
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
      // iOS Safari: prevent body scroll while expanded player is open
      const preventBodyScroll = (e: TouchEvent) => {
        // Allow scroll inside script container, block everywhere else
        if (!(e.target as HTMLElement)?.closest('.script-scroll-container')) {
          e.preventDefault();
        }
      };
      document.addEventListener('touchmove', preventBodyScroll, { passive: false });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('touchmove', preventBodyScroll);
      };
    } else {
      document.body.style.overflow = '';
      setDragY(0);
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!shouldRender) return null;

  const content = (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-background flex flex-col overscroll-contain",
          dragY > 0 ? "" : "transition-[transform,opacity] duration-300 ease-out",
          isVisible ? "opacity-100" : "opacity-0 translate-y-full"
        )}
        style={dragY > 0 ? { transform: `translateY(${dragY}px)`, opacity: Math.max(0.3, 1 - dragY / 400) } : undefined}
        onTouchStart={(e) => {
          const y = e.touches[0].clientY;
          dragStartRef.current = y;
          // Only allow swipe-to-dismiss when touch starts in top 15% of screen (header area)
          dragAllowed.current = y < window.innerHeight * 0.15;
        }}
        onTouchMove={(e) => {
          if (!dragAllowed.current) return;
          const diff = e.touches[0].clientY - dragStartRef.current;
          if (diff > 0) setDragY(diff);
        }}
        onTouchEnd={() => {
          if (dragAllowed.current && dragY > 120) { onClose(); }
          setDragY(0);
          dragAllowed.current = false;
        }}
      >
        {/* Blurred background image — visible but readable */}
        {imageUrl && (
          <>
            <div
              className="absolute inset-0 scale-110"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px) saturate(1.3) brightness(0.9)',
                opacity: 0.55,
              }}
            />
            {/* Light: semi-transparent overlay. Dark: darker overlay for text contrast */}
            <div className="absolute inset-0 bg-background/55 dark:bg-background/60" />
          </>
        )}
        {!imageUrl && <div className="absolute inset-0 bg-background" />}

        {/* Content */}
        <div className="relative flex flex-col h-full safe-area-top safe-area-bottom">
          {/* Drag indicator */}
          <div className="flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          {/* Header — now playing + collapse arrow */}
          <div className="flex flex-col items-center px-4 pb-1">
            <div className="w-full flex items-center justify-between">
              <div className="w-10" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {t('nowPlaying', lang)}
              </span>
              <ThemeToggle />
            </div>
            <button
              onClick={() => { haptics.light(); onClose(); }}
              className="w-12 h-8 flex items-center justify-center text-muted-foreground/60 active:opacity-60 -mt-0.5"
            >
              <ChevronDown className="w-7 h-7" />
            </button>
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
