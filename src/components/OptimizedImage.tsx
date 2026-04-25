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
  fetchPriority?: 'high' | 'low' | 'auto';
}

export function OptimizedImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  fetchPriority = 'auto',
}: OptimizedImageProps) {
  const cdnUrl = getDirectImageUrl(src);
  const fallbackUrl = src || '/placeholder.svg';
  const [loaded, setLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setShowFallback(false);
  }, [src]);

  const currentSrc = showFallback ? fallbackUrl : cdnUrl;

  const handleError = () => {
    if (!showFallback && cdnUrl !== fallbackUrl) {
      setShowFallback(true);
    } else {
      setError(true);
    }
  };

  return (
    <div className="relative overflow-hidden w-full h-full">
      {(!loaded || error) && (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          {error ? (
            <svg className="w-8 h-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          ) : (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
        </div>
      )}
      {!error && (
        <img
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 ${className || ''}`}
          loading={loading}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleError}
        />
      )}
    </div>
  );
}
