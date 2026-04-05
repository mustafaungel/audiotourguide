import { Headphones } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AudioGuideLoaderProps {
  variant?: 'page' | 'card' | 'grid' | 'initial';
  message?: string;
  count?: number;
}

const AudioWave = ({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const heights = {
    sm: { min: 'h-1', max: 'h-3' },
    md: { min: 'h-1', max: 'h-5' },
    lg: { min: 'h-1.5', max: 'h-7' },
  };
  const barWidth = size === 'sm' ? 'w-0.5' : size === 'lg' ? 'w-1.5' : 'w-1';

  return (
    <div className="flex items-center justify-center gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`${barWidth} rounded-full bg-primary audio-wave-bar`}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
};

// Full page loader (GuideDetail, AudioAccess, PaymentSuccess)
const PageLoader = ({ message }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center space-y-5">
      <div className="relative inline-flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center audio-icon-pulse">
          <Headphones className="w-8 h-8 text-primary" />
        </div>
      </div>
      <AudioWave size="lg" />
      {message && (
        <p className="text-muted-foreground text-sm font-medium audio-message-fade">
          {message}
        </p>
      )}
    </div>
  </div>
);

// Card skeleton loader (Index, Guides, FeaturedGuides)
const CardLoader = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(count)].map((_, i) => (
      <div
        key={i}
        className="mobile-card overflow-hidden animate-pulse"
        style={{ animationDelay: `${i * 0.08}s` }}
      >
        {/* Image area with audio icon */}
        <div className="aspect-video bg-muted rounded-lg mb-4 relative flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 opacity-30">
            <Headphones className="w-8 h-8 text-primary" />
            <AudioWave size="sm" />
          </div>
        </div>
        {/* Text skeleton lines */}
        <div className="h-4 bg-muted rounded-full mb-2 w-4/5"></div>
        <div className="h-3 bg-muted rounded-full w-3/5"></div>
      </div>
    ))}
  </div>
);

// Grid loader (Countries)
const GridLoader = ({ count = 12 }: { count?: number }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
    {[...Array(count)].map((_, i) => (
      <Card key={i} className="mobile-card animate-pulse" style={{ animationDelay: `${i * 0.05}s` }}>
        <CardContent className="p-4 text-center">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3 flex items-center justify-center">
            <Headphones className="w-6 h-6 text-primary/20" />
          </div>
          <div className="h-4 bg-muted rounded-full mb-2"></div>
          <div className="h-3 bg-muted rounded-full w-3/4 mx-auto"></div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Minimal initial loader (App.tsx Suspense fallback)
const InitialLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto audio-icon-pulse">
        <Headphones className="w-6 h-6 text-primary" />
      </div>
      <AudioWave size="md" />
    </div>
  </div>
);

export const AudioGuideLoader = ({ variant = 'page', message, count }: AudioGuideLoaderProps) => {
  switch (variant) {
    case 'page':
      return <PageLoader message={message} />;
    case 'card':
      return <CardLoader count={count} />;
    case 'grid':
      return <GridLoader count={count} />;
    case 'initial':
      return <InitialLoader />;
    default:
      return <PageLoader message={message} />;
  }
};
