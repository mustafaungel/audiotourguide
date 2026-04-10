import React from 'react';
import { cn } from '@/lib/utils';
import { useSiteBranding } from '@/hooks/useSiteBranding';
import { useTheme } from 'next-themes';

interface ResponsiveLogoProps {
  className?: string;
  showCompanyName?: boolean;
  variant?: 'full' | 'compact' | 'icon-only';
  size?: 'sm' | 'md' | 'lg';
  forceIcon?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-auto',
  md: 'h-12 sm:h-16 w-auto',
  lg: 'h-16 sm:h-24 w-auto',
};

const iconSizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8 sm:w-10 sm:h-10',
  lg: 'w-12 h-12 sm:w-16 sm:h-16',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'mobile-text sm:text-lg',
  lg: 'text-lg sm:text-xl',
};

const FallbackIcon: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => (
  <img
    src="/logo-audio-tour-guides.png"
    alt="Audio Tour Guides"
    className={cn("object-contain flex-shrink-0", iconSizeClasses[size])}
    loading="eager"
  />
);

export const ResponsiveLogo: React.FC<ResponsiveLogoProps> = ({
  className,
  showCompanyName = true,
  variant = 'full',
  size = 'md',
  forceIcon = false,
}) => {
  const { branding } = useSiteBranding();
  const { resolvedTheme } = useTheme();

  const logoUrl = resolvedTheme === 'dark' && branding.darkLogoUrl
    ? branding.darkLogoUrl
    : branding.logoUrl || branding.darkLogoUrl;

  const showLogo = !forceIcon && logoUrl;

  const logoImg = showLogo ? (
    <img
      src={logoUrl!}
      alt={`${branding.companyName} logo`}
      className={cn("object-contain flex-shrink-0", sizeClasses[size])}
      loading="eager"
    />
  ) : (
    <FallbackIcon size={size} />
  );

  if (variant === 'icon-only') {
    return <div className={cn("flex items-center", className)}>{logoImg}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2 min-w-0", className)}>
      {variant === 'full' ? (
        <div className="flex items-center space-x-2 min-w-0">
          {logoImg}
          {showCompanyName && (
            <span className={cn("font-bold font-playfair text-foreground truncate", textSizeClasses[size])}>
              {branding.companyName}
            </span>
          )}
        </div>
      ) : (
        <>
          {logoImg}
          {showCompanyName && (
            <span className={cn("font-bold font-playfair text-foreground truncate", textSizeClasses[size])}>
              {branding.companyName}
            </span>
          )}
        </>
      )}
    </div>
  );
};
