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

// Clean reading mode — all paragraphs equally readable, user scrolls manually
const ScriptReadingView: React.FC<{ scriptText: string; lang?: string }> = ({ scriptText, lang }) => {
  const paragraphs = useMemo(() => {
    if (!scriptText) return [];

    // Split by double-newlines
    const rawParagraphs = scriptText.split(/\n\n+/);
    const cleaned: string[] = [];

    for (const p of rawParagraphs) {
      // Normalize whitespace: collapse multiple spaces, trim lines
      const text = p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length >= 10) cleaned.push(text);
    }

    // If no paragraph breaks, split by sentences into chunks
    if (cleaned.length <= 1 && scriptText.length > 200) {
      const allText = scriptText.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      const sentences = allText.split(/(?<=[.!?。！？])\s+/).filter(s => s.trim().length > 5);
      if (sentences.length >= 4) {
        const chunkSize = Math.ceil(sentences.length / Math.min(5, Math.ceil(sentences.length / 3)));
        const chunks: string[] = [];
        for (let i = 0; i < sentences.length; i += chunkSize) {
          chunks.push(sentences.slice(i, i + chunkSize).join(' '));
        }
        if (chunks.length >= 2) return chunks;
      }
    }

    // Merge very short paragraphs into previous
    const merged: string[] = [];
    for (const text of cleaned) {
      if (text.length < 30 && merged.length > 0) {
        merged[merged.length - 1] += ' ' + text;
      } else {
        merged.push(text);
      }
    }

    return merged.length > 0 ? merged : cleaned;
  }, [scriptText]);

  if (paragraphs.length === 0) return null;

  return (
    <div className="h-full relative">
      <div
        className="h-full overflow-y-auto overscroll-contain script-scroll-container"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="h-[4vh]" />
        <div className="px-4 flex flex-col gap-5">
          {paragraphs.map((text, i) => {
            const spaceIdx = text.indexOf(' ');
            const firstWord = spaceIdx > 0 ? text.slice(0, spaceIdx) : text;
            const rest = spaceIdx > 0 ? text.slice(spaceIdx) : '';
            return (
              <React.Fragment key={i}>
                <div
                  className="rounded-xl p-5 backdrop-blur-md border bg-black/[0.04] border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.08)] dark:bg-white/[0.06] dark:border-white/[0.08] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                >
                  <p
                    lang={lang || 'en'}
                    className="text-[17px] font-normal leading-[1.9] text-foreground/90"
                    style={{
                      hyphens: 'auto',
                      WebkitHyphens: 'auto',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      textShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }}
                  >
                    <span
                      className="text-[1.6rem] font-black uppercase tracking-wide text-foreground"
                      style={{
                        textShadow: '2px 2px 4px rgba(0,0,0,0.4), 0 0 12px hsl(var(--primary) / 0.25)',
                      }}
                    >
                      {firstWord}
                    </span>
                    {rest}
                  </p>
                </div>
                {i < paragraphs.length - 1 && (
                  <div className="flex justify-center">
                    <div className="w-2/3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="h-[12vh]" />
      </div>

      {/* Top/bottom fades — transparent to match blurred bg */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-background/80 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background/80 to-transparent pointer-events-none z-10" />
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
          "fixed inset-0 z-[70] bg-background flex flex-col overscroll-contain will-change-transform",
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
                filter: 'blur(40px) saturate(1.2) brightness(0.9)',
                opacity: scriptText ? 0.2 : 0.55,
              }}
            />
            <div className={cn(
              "absolute inset-0",
              scriptText ? "bg-background/75 dark:bg-background/70" : "bg-background/55 dark:bg-background/60"
            )} />
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
          <div className="flex-1 relative overflow-hidden px-0 py-2">
            {scriptText ? (
              <ScriptReadingView scriptText={scriptText} lang={lang} />
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
