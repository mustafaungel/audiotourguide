import * as React from "react";
import { useState } from "react";
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

export function BottomSheet({
  open,
  onOpenChange,
  children,
  title,
  snapPoints = ['half'],
  defaultSnap = 'half',
  className,
}: BottomSheetProps) {
  const snapToHeight = (snap: 'mini' | 'half' | 'full') => {
    switch (snap) {
      case 'mini': return 88;
      case 'half': return 60;
      case 'full': return 95;
    }
  };

  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const [lastMoveTime, setLastMoveTime] = useState(0);
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

  const handleTransitionEnd = () => {
    if (!open) {
      setMounted(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
    setLastMoveTime(Date.now());
    setVelocity(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const newY = e.touches[0].clientY;
    const deltaY = newY - startY;
    
    const now = Date.now();
    const deltaTime = now - lastMoveTime;
    if (deltaTime > 0) {
      const newVelocity = (deltaY - currentY) / deltaTime;
      setVelocity(newVelocity);
    }
    
    setLastMoveTime(now);
    
    const rubberBand = (delta: number) => {
      if (delta < 0) return delta * 0.3;
      return delta;
    };
    
    setCurrentY(rubberBand(deltaY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    const velocityThreshold = 0.5;
    if (Math.abs(velocity) > velocityThreshold) {
      if (velocity > 0) {
        if (currentSnap === 'full') {
          setCurrentSnap('half');
        } else if (currentSnap === 'half') {
          setCurrentSnap('mini');
        } else {
          onOpenChange(false);
        }
      } else {
        if (currentSnap === 'mini') {
          setCurrentSnap('half');
        } else if (currentSnap === 'half') {
          setCurrentSnap('full');
        }
      }
    } else {
      if (currentY > 150) {
        if (currentSnap === 'full') {
          setCurrentSnap('half');
        } else if (currentSnap === 'half') {
          setCurrentSnap('mini');
        } else {
          onOpenChange(false);
        }
      } else if (currentY < -150) {
        if (currentSnap === 'mini') {
          setCurrentSnap('half');
        } else if (currentSnap === 'half') {
          setCurrentSnap('full');
        }
      }
    }
    
    setCurrentY(0);
    setStartY(0);
    setVelocity(0);
  };

  if (!mounted && !open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          touchAction: 'none',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease',
        }}
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background/95 rounded-t-[20px] shadow-2xl border-t border-border/20 z-50 flex flex-col",
          className
        )}
        style={{
          height: `${snapToHeight(currentSnap)}vh`,
          transform: open
            ? (isDragging ? `translateY(${Math.max(0, currentY)}px)` : 'translateY(0)')
            : 'translateY(100%)',
          transition: isDragging
            ? 'none'
            : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), height 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
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
