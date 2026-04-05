import * as React from "react";
import { useRef, useCallback, useState } from "react";
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
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      setCurrentSnap(defaultSnap);
    }
  }, [open, defaultSnap]);

  React.useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  const handleTransitionEnd = useCallback(() => {
    if (!open) {
      setMounted(false);
    }
  }, [open]);

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
        else onOpenChange(false);
      } else {
        if (currentSnap === 'mini') setCurrentSnap('half');
        else if (currentSnap === 'half') setCurrentSnap('full');
      }
    } else {
      if (d.currentY > 150) {
        if (currentSnap === 'full') setCurrentSnap('half');
        else if (currentSnap === 'half') setCurrentSnap('mini');
        else onOpenChange(false);
      } else if (d.currentY < -150) {
        if (currentSnap === 'mini') setCurrentSnap('half');
        else if (currentSnap === 'half') setCurrentSnap('full');
      }
    }

    d.currentY = 0;
    d.startY = 0;
    d.velocity = 0;
  }, [currentSnap, onOpenChange]);

  if (!mounted && !open) return null;

  const translateY = open ? snapToOffset(currentSnap) : '100%';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          touchAction: 'none',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.35s ease',
          willChange: 'opacity',
        }}
        onClick={() => onOpenChange(false)}
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
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto px-4 pb-safe"
          style={{ overscrollBehavior: 'contain' }}
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
