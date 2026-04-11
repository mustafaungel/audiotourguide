import { Headphones } from 'lucide-react';
import { useLiveListeners } from '@/hooks/useLiveListeners';

interface LiveListenersBadgeProps {
  guideId: string;
  variant?: 'inline' | 'badge';
}

export function LiveListenersBadge({ guideId, variant = 'badge' }: LiveListenersBadgeProps) {
  const count = useLiveListeners(guideId);

  if (variant === 'inline') {
    return (
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
        </span>
        {count} listening
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full text-[10px] font-medium">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
      </span>
      <Headphones className="w-3 h-3" />
      <span>{count} listening now</span>
    </div>
  );
}
