import { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import { WifiOff } from 'lucide-react';

export const OfflineStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Badge variant="secondary" className="gap-1 fixed top-2 right-2 z-50">
      <WifiOff className="h-3 w-3" />
      Offline Mode
    </Badge>
  );
};
