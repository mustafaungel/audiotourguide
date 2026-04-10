import React from 'react';
import { cn } from '@/lib/utils';
import { useSiteBranding } from '@/hooks/useSiteBranding';
import { useTheme } from 'next-themes';

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
