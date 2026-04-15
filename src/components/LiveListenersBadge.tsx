import { Headphones } from 'lucide-react';
import { useLiveListeners } from '@/hooks/useLiveListeners';

interface LiveListenersBadgeProps {
  guideId: string;
  size?: 'default' | 'compact';
  realCount?: number;
}

function MiniEqualizer({ small = false }: { small?: boolean }) {
  const barClass = small ? 'live-equalizer-bar-sm' : 'live-equalizer-bar';
  const height = small ? 'h-[8px]' : 'h-[12px]';
  return (
    <span className={`flex items-end gap-[1.5px] ${height}`}>
      <span className={barClass} style={{ animationDelay: '-2200ms' }} />
      <span className={barClass} style={{ animationDelay: '-2000ms' }} />
      <span className={barClass} style={{ animationDelay: '-1800ms' }} />
    </span>
  );
}

export function LiveListenersBadge({ guideId, size = 'default', realCount }: LiveListenersBadgeProps) {
  const count = useLiveListeners(guideId, realCount);

  const isCompact = size === 'compact';

  const outerPadding = isCompact ? 'p-[1px]' : 'p-[1px]';
  const innerPadding = isCompact ? 'px-2 py-1' : 'px-3 py-1.5';
  const fontSize = isCompact ? 'text-[9px]' : 'text-[11px]';
  const iconSize = isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <div className={`inline-flex w-fit max-w-full self-start rounded-full overflow-hidden glass-badge ${outerPadding} shadow-[0_2px_12px_hsl(var(--primary)/0.12)]`}>
      <div className={`inline-flex w-fit max-w-full items-center gap-1.5 ${innerPadding} rounded-full ${fontSize} text-primary`}>
        <Headphones className={`${iconSize} shrink-0`} style={{ animation: 'pulse 2.2s ease-in-out infinite', animationDelay: '-2200ms' }} />
        <span className="min-w-0 truncate whitespace-nowrap"><span className="font-semibold">{count}</span> Listening</span>
      </div>
    </div>
  );
}
