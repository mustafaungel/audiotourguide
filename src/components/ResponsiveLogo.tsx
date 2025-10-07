import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useSiteBranding } from '@/hooks/useSiteBranding';
import { useTheme } from 'next-themes';
import { MapPin } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { OptimizedImage } from '@/components/OptimizedImage';
interface ResponsiveLogoProps {
  className?: string;
  showCompanyName?: boolean;
  variant?: 'full' | 'compact' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  forceIcon?: boolean;
}
export const ResponsiveLogo: React.FC<ResponsiveLogoProps> = ({
  className,
  showCompanyName = true,
  variant = 'full',
  size = 'md',
  forceIcon = false
}) => {
  const {
    branding,
    loading: brandingLoading
  } = useSiteBranding();
  const {
    resolvedTheme
  } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use resolved theme to determine which logo to display
  const getLogoUrl = () => {
    if (resolvedTheme === 'dark' && branding.darkLogoUrl) {
      return branding.darkLogoUrl;
    }
    // Fallback to whichever is available
    return branding.logoUrl || branding.darkLogoUrl;
  };
  const logoUrl = getLogoUrl();

useEffect(() => {
  if (forceIcon) {
    setImgLoaded(false);
    setImgError(false);
    return;
  }
  setImgLoaded(false);
  setImgError(false);
  if (!logoUrl) return;
  const img = new Image();
  img.onload = () => setImgLoaded(true);
  img.onerror = () => setImgError(true);
  img.src = logoUrl;
}, [logoUrl, forceIcon]);

  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 sm:h-16 w-auto', 
    lg: 'h-16 sm:h-24 w-auto'
  };
  const iconSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8 sm:w-10 sm:h-10',
    lg: 'w-12 h-12 sm:w-16 sm:h-16'
  };
  const textSizeClasses = {
    sm: 'text-sm',
    md: 'mobile-text sm:text-lg',
    lg: 'text-lg sm:text-xl'
  };
  const renderFallbackIcon = () => <div className={cn("bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 relative", iconSizeClasses[size])}>
      <MapPin className={cn("text-teal-100", size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-6 h-6 sm:w-8 sm:h-8')} />
      <div className={cn("absolute -top-1 -right-1 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center", size === 'sm' ? 'w-2 h-2' : 'w-3 h-3')}>
        <div className={cn("bg-white rounded-full", size === 'sm' ? 'w-1 h-1' : 'w-1.5 h-1.5')}></div>
      </div>
    </div>;
if (variant === 'icon-only') {
  return <div className={cn("flex items-center", className)}>
      {forceIcon ? (
        renderFallbackIcon()
      ) : brandingLoading ? (
        <Skeleton className={cn("rounded-lg", iconSizeClasses[size])} />
      ) : imgError ? (
        renderFallbackIcon()
      ) : logoUrl ? (
        imgLoaded ? (
          <OptimizedImage
            key={logoUrl}
            src={logoUrl}
            alt={`${branding.companyName} logo`}
            width={size === 'sm' ? 64 : size === 'md' ? 128 : 192}
            height={size === 'sm' ? 64 : size === 'md' ? 128 : 192}
            className={cn("object-contain flex-shrink-0", sizeClasses[size])}
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <Skeleton className={cn("rounded-lg", iconSizeClasses[size])} />
        )
      ) : (
        renderFallbackIcon()
      )}
    </div>;
}
if (variant === 'compact') {
  return <div className={cn("flex items-center space-x-2 min-w-0", className)}>
      {forceIcon ? (
        renderFallbackIcon()
      ) : brandingLoading ? (
        <Skeleton
          className={cn(
            "flex-shrink-0",
            size === 'sm'
              ? 'h-8 w-20'
              : size === 'md'
              ? 'h-12 sm:h-16 w-28 sm:w-36'
              : 'h-16 sm:h-24 w-40 sm:w-48'
          )}
        />
      ) : imgError ? (
        renderFallbackIcon()
      ) : logoUrl ? (
        imgLoaded ? (
          <OptimizedImage
            key={logoUrl}
            src={logoUrl}
            alt={`${branding.companyName} logo`}
            width={size === 'sm' ? 64 : size === 'md' ? 128 : 192}
            height={size === 'sm' ? 64 : size === 'md' ? 128 : 192}
            className={cn("object-contain flex-shrink-0", sizeClasses[size])}
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <Skeleton
            className={cn(
              "flex-shrink-0",
              size === 'sm'
                ? 'h-8 w-20'
                : size === 'md'
                ? 'h-12 sm:h-16 w-28 sm:w-36'
                : 'h-16 sm:h-24 w-40 sm:w-48'
            )}
          />
        )
      ) : (
        renderFallbackIcon()
      )}
      {showCompanyName && <span className={cn("font-bold font-playfair text-foreground truncate", textSizeClasses[size])}>
          {branding.companyName}
        </span>}
    </div>;
}
return <div className={cn("flex items-center space-x-2 min-w-0", className)}>
    <div className="flex items-center space-x-2 min-w-0">
      {forceIcon ? (
        renderFallbackIcon()
      ) : brandingLoading ? (
        <Skeleton
          className={cn(
            "flex-shrink-0",
            size === 'sm'
              ? 'h-8 w-24'
              : size === 'md'
              ? 'h-12 sm:h-16 w-32 sm:w-40'
              : 'h-16 sm:h-24 w-48 sm:w-60'
          )}
        />
      ) : imgError ? (
        renderFallbackIcon()
      ) : logoUrl ? (
        imgLoaded ? (
          <OptimizedImage
            key={logoUrl}
            src={logoUrl}
            alt={`${branding.companyName} logo`}
            width={size === 'sm' ? 64 : size === 'md' ? 128 : 192}
            height={size === 'sm' ? 64 : size === 'md' ? 128 : 192}
            className={cn("object-contain flex-shrink-0", sizeClasses[size])}
            loading="eager"
            fetchPriority="high"
          />
        ) : (
          <Skeleton
            className={cn(
              "flex-shrink-0",
              size === 'sm'
                ? 'h-8 w-24'
                : size === 'md'
                ? 'h-12 sm:h-16 w-32 sm:w-40'
                : 'h-16 sm:h-24 w-48 sm:w-60'
            )}
          />
        )
      ) : (
        renderFallbackIcon()
      )}
      {showCompanyName && <span className={cn("font-bold font-playfair text-foreground truncate", textSizeClasses[size])}>
          {branding.companyName}
        </span>}
    </div>
  </div>;
};