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
      <span className="flex items-center gap-1.5 text-[10px] text-primary font-medium">
        <MiniEqualizer small />
        <Headphones className="w-2.5 h-2.5" />
        {count} listening
      </span>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-primary/5 backdrop-blur-sm text-primary border border-primary/10 px-2.5 py-1 rounded-full text-[11px] font-medium">
      <MiniEqualizer />
      <Headphones className="w-3 h-3" />
      <span>{count} listening now</span>
    </div>
  );
}
