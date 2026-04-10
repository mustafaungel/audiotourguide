import { useState, useEffect } from 'react';
import { getOptimizedImageUrl, getDirectImageUrl } from '@/lib/url-utils';

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
  quality = 80,
  loading = 'lazy'
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(
    getOptimizedImageUrl(src, { width, height, quality })
  );
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const directUrl = getDirectImageUrl(src);

  const handleError = () => {
    if (!hasError && imgSrc !== directUrl) {
      setHasError(true);
      setImgSrc(directUrl);
    }
  };

  // Reset when src changes
  useEffect(() => {
    setImgSrc(getOptimizedImageUrl(src, { width, height, quality }));
    setHasError(false);
    setLoaded(false);
  }, [src, width, height, quality]);

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      {/* Shimmer placeholder — visible until image loads */}
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className || ''}`}
        loading={loading}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={handleError}
      />
    </div>
  );
}
