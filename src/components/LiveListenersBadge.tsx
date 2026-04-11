import { Headphones } from 'lucide-react';
import { useLiveListeners } from '@/hooks/useLiveListeners';

interface LiveListenersBadgeProps {
  guideId: string;
  variant?: 'inline' | 'badge';
}

function MiniEqualizer({ small = false }: { small?: boolean }) {
  const barClass = small ? 'live-equalizer-bar-sm' : 'live-equalizer-bar';
  const height = small ? 'h-[8px]' : 'h-[12px]';
  return (
    <span className={`flex items-end gap-[1.5px] ${height}`}>
      <span className={barClass} style={{ animationDelay: '0ms' }} />
      <span className={barClass} style={{ animationDelay: '200ms' }} />
      <span className={barClass} style={{ animationDelay: '400ms' }} />
    </span>
  );
}

export function LiveListenersBadge({ guideId, variant = 'badge' }: LiveListenersBadgeProps) {
  const count = useLiveListeners(guideId);

  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-primary/70 font-medium">
        <Headphones className="w-2.5 h-2.5 animate-pulse" />
        <span className="font-mono tabular-nums">{count}</span>
        <span className="italic">listening</span>
      </span>
    );
  }

  return (
    <div className="inline-flex rounded-full bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 p-[1px] shadow-[0_2px_12px_hsl(var(--primary)/0.12)]">
      <div className="inline-flex items-center gap-1.5 bg-card backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] text-primary">="inline-flex items-center gap-1.5 bg-card backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] text-primary"> className="inline-flex items-center gap-1.5 bg-card backdrop-blur-sm px-3 py-1.5 rounded-full text-[11px] text-primary"> px-3 py-1.5 rounded-full text-[11px] text-primary">
        <MiniEqualizer />
        <Headphones className="w-3 h-3" />
        <span><span className="font-semibold">{count}</span> listening now</span>
      </div>
    </div>
  );
}
