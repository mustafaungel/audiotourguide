import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';

export interface SegmentItem {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SegmentedControlProps {
  items: SegmentItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ items, value, onValueChange, className }: SegmentedControlProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const activeIndex = items.findIndex(item => item.value === value);
    if (activeIndex < 0) return;
    const buttons = container.querySelectorAll<HTMLButtonElement>('[data-segment]');
    const activeBtn = buttons[activeIndex];
    if (!activeBtn) return;
    setIndicatorStyle({
      width: activeBtn.offsetWidth,
      transform: `translateX(${activeBtn.offsetLeft}px)`,
    });
  }, [value, items]);

  const handleSelect = (val: string) => {
    if (val !== value) {
      haptics.selection();
      onValueChange(val);
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center rounded-xl bg-muted p-1 gap-0.5',
        className
      )}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 left-0 h-[calc(100%-8px)] rounded-lg bg-background shadow-sm transition-all duration-300 ease-out"
        style={indicatorStyle}
      />

      {items.map((item) => {
        const isActive = item.value === value;
        const Icon = item.icon;
        return (
          <button
            key={item.value}
            data-segment
            onClick={() => handleSelect(item.value)}
            className={cn(
              'relative z-10 flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 min-h-[44px] touch-manipulation select-none',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground/80'
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
