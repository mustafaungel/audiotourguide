import { useEffect } from 'react';
import { useSiteBranding } from '@/hooks/useSiteBranding';

export const FaviconUpdater: React.FC = () => {
  const { branding } = useSiteBranding();

  useEffect(() => {
    const faviconHref = branding.faviconUrl || '/logo-audio-tour-guides.png';
    // Add cache-busting param to force browser to reload favicon
    const cacheBustedHref = faviconHref.includes('?')
      ? `${faviconHref}&_v=${Date.now()}`
      : `${faviconHref}?_v=${Date.now()}`;
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = cacheBustedHref;
  }, [branding.faviconUrl]);

  return null;
};
