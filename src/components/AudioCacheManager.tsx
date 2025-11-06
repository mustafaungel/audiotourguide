import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { clearAudioCache, getAudioCacheSize } from '@/utils/serviceWorkerRegistration';
import { Trash2, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const AudioCacheManager = () => {
  const [cacheSize, setCacheSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadCacheSize = async () => {
    const size = await getAudioCacheSize();
    setCacheSize(size);
  };

  useEffect(() => {
    loadCacheSize();
  }, []);

  const handleClearCache = async () => {
    setLoading(true);
    try {
      const success = await clearAudioCache();
      if (success) {
        toast({
          title: 'Cache Cleared',
          description: 'All offline audio has been removed',
        });
        await loadCacheSize();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Offline Audio Cache
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Cache Size</span>
          <span className="font-medium">{formatSize(cacheSize)}</span>
        </div>
        
        <Button
          variant="outline"
          onClick={handleClearCache}
          disabled={loading || cacheSize === 0}
          className="w-full"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear Offline Cache
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Audio files are automatically cached when you play them. Clear cache to free up storage space.
        </p>
      </CardContent>
    </Card>
  );
};
