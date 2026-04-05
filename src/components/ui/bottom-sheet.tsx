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
    
    // Calculate velocity
    const now = Date.now();
    const deltaTime = now - lastMoveTime;
    if (deltaTime > 0) {
      const newVelocity = (deltaY - currentY) / deltaTime;
      setVelocity(newVelocity);
    }
    
    setLastMoveTime(now);
    
    // Rubber band effect at boundaries
    const rubberBand = (delta: number) => {
      if (delta < 0) return delta * 0.3; // Resistance when pulling up
      return delta;
    };
    
    setCurrentY(rubberBand(deltaY));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Velocity-based snap decision
    const velocityThreshold = 0.5;
    if (Math.abs(velocity) > velocityThreshold) {
      if (velocity > 0) {
        // Swipe down
        if (currentSnap === 'full') {
          setCurrentSnap('half');
        } else if (currentSnap === 'half') {
          setCurrentSnap('mini');
        } else {
          onOpenChange(false);
        }
      } else {
        // Swipe up
        if (currentSnap === 'mini') {
          setCurrentSnap('half');
        } else if (currentSnap === 'half') {
          setCurrentSnap('full');
        }
      }
    } else {
      // Position-based snap
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
    
    // Reset position
    setCurrentY(0);
    setStartY(0);
    setVelocity(0);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div
        className="fixed inset-0 z-40 animate-in fade-in-0"
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          touchAction: 'none',
        }}
        onClick={() => onOpenChange(false)}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background/95 rounded-t-[20px] shadow-2xl border-t border-border/20 z-50 animate-in slide-in-from-bottom-2 flex flex-col",
          className
        )}
        style={{
          height: `${snapToHeight(currentSnap)}vh`,
          transform: isDragging ? `translateY(${Math.max(0, currentY)}px)` : 'translateY(0)',
          transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), height 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          willChange: 'transform',
        }}
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
