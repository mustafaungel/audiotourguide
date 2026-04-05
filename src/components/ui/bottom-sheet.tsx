import * as React from "react";
import { useRef, useCallback, useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: ('mini' | 'half' | 'full')[];
  defaultSnap?: 'mini' | 'half' | 'full';
  className?: string;
}

const snapToOffset = (snap: 'mini' | 'half' | 'full') => {
  switch (snap) {
    case 'mini': return 'calc(95vh - 88px)';
    case 'half': return '35vh';
    case 'full': return '0px';
  }
};

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  snapPoints = ['half'],
  defaultSnap = 'half',
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({
    startY: 0,
    currentY: 0,
    velocity: 0,
    lastTime: 0,
    isDragging: false,
    rafId: 0,
  });

  const [currentSnap, setCurrentSnap] = useState<'mini' | 'half' | 'full'>(defaultSnap);
  // Two-phase mount: rendered = in DOM, visible = animated to position
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const scrollYRef = useRef(0);

  // Open: mount first, then animate in next frame
  useEffect(() => {
    if (open) {
      setCurrentSnap(defaultSnap);
      setRendered(true);
      // Force a layout read before animating in
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else {
      // Close: animate out first, unmount after transition
      setVisible(false);
    }
  }, [open, defaultSnap]);

  // Lightweight scroll lock — no position:fixed, no scroll jump
  useEffect(() => {
    if (rendered) {
      scrollYRef.current = window.scrollY;
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      return () => {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      };
    }
  }, [rendered]);

  const handleTransitionEnd = useCallback(() => {
    if (!visible) {
      setRendered(false);
    }
  }, [visible]);

  const applyDragTransform = useCallback((deltaY: number) => {
    if (!sheetRef.current) return;
    const rubberBand = deltaY < 0 ? deltaY * 0.3 : deltaY;
    const base = snapToOffset(currentSnap);
    sheetRef.current.style.transition = 'none';
    sheetRef.current.style.transform = `translateY(calc(${base} + ${rubberBand}px))`;
  }, [currentSnap]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const d = dragRef.current;
    d.startY = e.touches[0].clientY;
    d.currentY = 0;
    d.isDragging = true;
    d.lastTime = Date.now();
    d.velocity = 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const d = dragRef.current;
    if (!d.isDragging) return;

    const newY = e.touches[0].clientY;
    const deltaY = newY - d.startY;
    const now = Date.now();
    const dt = now - d.lastTime;
    if (dt > 0) {
      d.velocity = (deltaY - d.currentY) / dt;
    }
    d.currentY = deltaY;
    d.lastTime = now;

    cancelAnimationFrame(d.rafId);
    d.rafId = requestAnimationFrame(() => {
      applyDragTransform(deltaY);
    });
  }, [applyDragTransform]);

  const handleTouchEnd = useCallback(() => {
    const d = dragRef.current;
    d.isDragging = false;
    cancelAnimationFrame(d.rafId);

    if (!sheetRef.current) return;

    // Re-enable transitions
    sheetRef.current.style.transition = '';
    sheetRef.current.style.transform = '';

    const velocityThreshold = 0.5;
    if (Math.abs(d.velocity) > velocityThreshold) {
      if (d.velocity > 0) {
        if (currentSnap === 'full') setCurrentSnap('half');
        else if (currentSnap === 'half') setCurrentSnap('mini');
        else setCurrentSnap('mini');
      } else {
        if (currentSnap === 'mini') setCurrentSnap('half');
        else if (currentSnap === 'half') setCurrentSnap('full');
      }
    } else {
      if (d.currentY > 150) {
        if (currentSnap === 'full') setCurrentSnap('half');
        else if (currentSnap === 'half') setCurrentSnap('mini');
        else setCurrentSnap('mini');
      } else if (d.currentY < -150) {
        if (currentSnap === 'mini') setCurrentSnap('half');
        else if (currentSnap === 'half') setCurrentSnap('full');
      }
    }

    d.currentY = 0;
    d.startY = 0;
    d.velocity = 0;
  }, [currentSnap, onOpenChange]);

  if (!rendered) return null;

  const translateY = visible ? snapToOffset(currentSnap) : '100%';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          touchAction: 'none',
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          transition: 'opacity 0.35s ease',
          willChange: 'opacity',
        }}
        onClick={() => {}}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background rounded-t-[20px] shadow-2xl border-t border-border/20 z-50 flex flex-col",
          className
        )}
        style={{
          height: '95vh',
          transform: `translateY(${translateY})`,
          transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          willChange: 'transform',
        }}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-4 pb-3 pt-1 border-b border-border/30"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            <h3 className="text-lg font-semibold">{title}</h3>
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onOpenChange(false); }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="rounded-full p-2.5 bg-foreground/10 border border-border hover:bg-foreground/20 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className="overflow-y-scroll px-4 pb-safe"
          style={{ overscrollBehavior: 'contain', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', maxHeight: title ? 'calc(95vh - 80px)' : 'calc(95vh - 28px)' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

interface BottomSheetListItemProps {
  selected?: boolean;
  onSelect?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheetListItem({
  selected,
  onSelect,
  children,
  className,
}: BottomSheetListItemProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "ios-list-item w-full text-left",
        selected && "bg-primary/5",
        className
      )}
    >
      {children}
    </button>
  );
}
