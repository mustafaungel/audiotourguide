import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Volume2 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileVolumeHelperProps {
  show: boolean;
  onDismiss: () => void;
}

export const MobileVolumeHelper: React.FC<MobileVolumeHelperProps> = ({ show, onDismiss }) => {
  const isMobile = useIsMobile();

  if (!show || !isMobile) return null;

  return (
    <Alert className="mb-4 bg-primary/10 border-primary/20">
      <Info className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          <span className="text-sm">
            Use device volume buttons for best audio control on mobile
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-muted-foreground hover:text-foreground ml-2"
        >
          ✕
        </button>
      </AlertDescription>
    </Alert>
  );
};