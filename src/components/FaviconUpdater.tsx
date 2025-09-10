import React, { useEffect } from 'react';
import { useSiteBranding } from '@/hooks/useSiteBranding';

export const FaviconUpdater: React.FC = () => {
  const { branding } = useSiteBranding();

  useEffect(() => {
    if (branding.faviconUrl) {
      // Update the favicon link
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = branding.faviconUrl;
    }

    // Update the document title
    if (branding.companyName) {
      document.title = `${branding.companyName} - Discover World Heritage`;
    }
  }, [branding.faviconUrl, branding.companyName]);

  return null; // This component doesn't render anything visible
};