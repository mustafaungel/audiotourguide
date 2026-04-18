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

// On-demand Lora font loading (only when ExpandedPlayer is used; idempotent)
if (typeof document !== 'undefined' && !document.querySelector('link[data-lora-font]')) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap';
  link.setAttribute('data-lora-font', 'true');
  document.head.appendChild(link);
}

// Parchment scroll reading view — antique tour guide aesthetic
const toRoman = (n: number): string => {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let r = '';
  for (let i = 0; i < vals.length; i++) { while (n >= vals[i]) { r += syms[i]; n -= vals[i]; } }
  return r;
};

const ScriptReadingView: React.FC<{ scriptText: string; lang?: string }> = ({ scriptText, lang }) => {
  const paragraphs = useMemo(() => {
    if (!scriptText) return [];
    const rawParagraphs = scriptText.split(/\n\n+/);
    const cleaned: string[] = [];
    for (const p of rawParagraphs) {
      const text = p.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      if (text.length >= 10) cleaned.push(text);
    }
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
      {/* Parchment page */}
      <div
        className="absolute inset-1 inset-y-0 rounded-2xl bg-amber-50/85 dark:bg-stone-900/85 border border-amber-200/30 dark:border-stone-700/30"
        style={{
          boxShadow: 'inset 0 3px 15px rgba(120,80,30,0.08), inset 0 -3px 15px rgba(120,80,30,0.05), 0 4px 30px rgba(0,0,0,0.1)',
          backgroundImage: 'radial-gradient(ellipse at 15% 50%, rgba(180,140,80,0.05) 0%, transparent 60%), radial-gradient(ellipse at 85% 20%, rgba(160,120,60,0.04) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(140,100,40,0.03) 0%, transparent 50%)',
        }}
      />

      <div
        className="relative h-full overflow-y-auto overscroll-contain script-scroll-container"
        style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
      >
        <div className="h-[5vh]" />
        <div className="px-6 pb-8" style={{ maxWidth: '88%', margin: '0 auto' }}>
          {paragraphs.map((text, i) => {
            // Split first sentence from rest
            const sentenceMatch = text.match(/^(.+?[.!?。！？])\s*(.*)/s);
            const firstSentence = sentenceMatch ? sentenceMatch[1] : text;
            const restText = sentenceMatch ? sentenceMatch[2] : '';

            return (
              <React.Fragment key={i}>
                <p
                  lang={lang || 'en'}
                  className="mb-1 text-stone-800 dark:text-amber-100/90"
                  style={{
                    fontFamily: "'Lora', 'Playfair Display', Georgia, serif",
                    fontSize: '15.5px',
                    lineHeight: '2.0',
                    fontWeight: 400,
                    letterSpacing: '0.02em',
                    textAlign: 'justify',
                    textJustify: 'inter-word' as any,
                    hyphens: 'auto',
                    WebkitHyphens: 'auto',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                >
                  {/* Drop cap — first letter */}
                  <span
                    className="text-primary dark:text-amber-400"
                    style={{
                      float: 'left',
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: '3.2em',
                      lineHeight: '0.85',
                      fontWeight: 700,
                      marginRight: '6px',
                      marginTop: '4px',
                    }}
                  >
                    {firstSentence.charAt(0)}
                  </span>
                  {/* First sentence — bold, primary color */}
                  <span
                    className="text-primary dark:text-amber-400"
                    style={{
                      fontFamily: "'Playfair Display', 'Lora', Georgia, serif",
                      fontSize: '17px',
                      fontWeight: 700,
                    }}
                  >
                    {firstSentence.slice(1)}
                  </span>
                  {restText && <> {restText}</>}
                </p>

                {/* Ornamental divider between paragraphs */}
                {i < paragraphs.length - 1 && (
                  <div className="flex items-center justify-center gap-2 my-5">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-400/25 dark:to-amber-500/20" />
                    <span className="text-amber-400/50 dark:text-amber-500/30 text-[10px] tracking-[0.3em]">✦ ✦ ✦</span>
                    <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-400/25 dark:to-amber-500/20" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Roman numeral page counter — bottom center */}
        <div className="flex justify-center pb-6">
          <span className="text-[11px] font-medium text-stone-400/60 dark:text-stone-500/40 tracking-[0.2em] font-serif">
            — {toRoman(paragraphs.length)} —
          </span>
        </div>

        <div className="h-[10vh]" />
      </div>

      {/* Parchment-tinted fades */}
      <div className="absolute top-0 left-1 right-1 h-20 rounded-t-2xl bg-gradient-to-b from-amber-50/95 dark:from-stone-900/95 via-amber-50/60 dark:via-stone-900/60 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-1 right-1 h-16 rounded-b-2xl bg-gradient-to-t from-amber-50/95 dark:from-stone-900/95 via-amber-50/60 dark:via-stone-900/60 to-transparent pointer-events-none z-10" />
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
  const dragYRef = useRef(0);
  const dragStartRef = useRef(0);
  const dragAllowed = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
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
          "transition-[transform,opacity] duration-300 ease-out",
          isVisible ? "opacity-100" : "opacity-0 translate-y-full"
        )}
        ref={containerRef}
        onTouchStart={(e) => {
          const y = e.touches[0].clientY;
          dragStartRef.current = y;
          dragAllowed.current = y < window.innerHeight * 0.15;
          if (dragAllowed.current && containerRef.current) {
            // Disable CSS transition during drag for direct manipulation
            containerRef.current.style.transition = 'none';
          }
        }}
        onTouchMove={(e) => {
          if (!dragAllowed.current || !containerRef.current) return;
          const diff = e.touches[0].clientY - dragStartRef.current;
          if (diff > 0) {
            dragYRef.current = diff;
            // Direct DOM manipulation — no React re-render per pixel
            containerRef.current.style.transform = `translateY(${diff}px)`;
            containerRef.current.style.opacity = `${Math.max(0.3, 1 - diff / 400)}`;
          }
        }}
        onTouchEnd={() => {
          if (!containerRef.current) return;
          const shouldClose = dragAllowed.current && dragYRef.current > 120;

          if (shouldClose) {
            // Animate out smoothly then close
            containerRef.current.style.transition = 'transform 250ms ease-out, opacity 250ms ease-out';
            containerRef.current.style.transform = 'translateY(100%)';
            containerRef.current.style.opacity = '0';
            setTimeout(() => onClose(), 260);
          } else {
            // Snap back
            containerRef.current.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out';
            containerRef.current.style.transform = '';
            containerRef.current.style.opacity = '';
          }

          dragYRef.current = 0;
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
