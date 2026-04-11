import { Headphones } from 'lucide-react';
import { useLiveListeners } from '@/hooks/useLiveListeners';

interface LiveListenersBadgeProps {
  guideId: string;
  size?: 'default' | 'compact';
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

export function LiveListenersBadge({ guideId, size = 'default' }: LiveListenersBadgeProps) {
  const count = useLiveListeners(guideId);

  const isCompact = size === 'compact';

  const outerPadding = isCompact ? 'p-[1px]' : 'p-[1px]';
  const innerPadding = isCompact ? 'px-2 py-1' : 'px-3 py-1.5';
  const fontSize = isCompact ? 'text-[9px]' : 'text-[11px]';
  const iconSize = isCompact ? 'w-2.5 h-2.5' : 'w-3 h-3';

  return (
    <div className={`inline-flex w-fit max-w-full self-start rounded-full overflow-hidden bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 ${outerPadding} shadow-[0_2px_12px_hsl(var(--primary)/0.12)]`}>
      <div className={`inline-flex w-fit max-w-full items-center gap-1.5 bg-card backdrop-blur-sm ${innerPadding} rounded-full ${fontSize} text-primary`}>
        <Headphones className={`${iconSize} shrink-0 animate-pulse`} />
        <span className="min-w-0 truncate whitespace-nowrap"><span className="min-w-0 truncate whitespace-nowrap"><span className="font-semibold">{count}</span> Listening</span></span>
      </div>
    </div>
  );
}
