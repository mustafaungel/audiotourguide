import { useState, useEffect } from 'react';
import { getDirectImageUrl } from '@/lib/url-utils';

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  quality?: number;
  loading?: 'lazy' | 'eager';
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy'
}: OptimizedImageProps) {
  const directUrl = getDirectImageUrl(src);
  const [loaded, setLoaded] = useState(false);

  // Reset when src changes
  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <div className="relative overflow-hidden w-full h-full">
      {/* Shimmer placeholder — visible until image loads */}
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={directUrl}
        alt={alt}
        width={width}
        height={height}
        className={`${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className || ''}`}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
