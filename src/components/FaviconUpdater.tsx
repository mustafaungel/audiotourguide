import { useEffect } from 'react';
import { useSiteBranding } from '@/hooks/useSiteBranding';

export const FaviconUpdater: React.FC = () => {
  const { branding } = useSiteBranding();

  useEffect(() => {
    if (branding.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = branding.faviconUrl;
    }

    if (branding.companyName) {
      document.title = `${branding.companyName} - Discover World Heritage`;
    }
  }, [branding.faviconUrl, branding.companyName]);

  return null;
};
