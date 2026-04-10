import { useEffect } from 'react';
import { useSiteBranding } from '@/hooks/useSiteBranding';

export const FaviconUpdater: React.FC = () => {
  const { branding } = useSiteBranding();

  useEffect(() => {
    const faviconHref = branding.faviconUrl || '/logo-audio-tour-guides.png';
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = faviconHref;

    // Don't override document.title - let React Helmet handle page-specific titles
  }, [branding.faviconUrl]);

  return null;
};
