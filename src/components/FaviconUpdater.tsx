import { useEffect } from 'react';
import { useSiteBranding } from '@/hooks/useSiteBranding';

export const FaviconUpdater: React.FC = () => {
  const { branding } = useSiteBranding();

  useEffect(() => {
    const apply = () => {
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
    };

    const ric = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined;
    const handle = ric ? ric(apply, { timeout: 2000 }) : window.setTimeout(apply, 1);

    return () => {
      const cic = (window as any).cancelIdleCallback as ((h: number) => void) | undefined;
      if (ric && cic) cic(handle as number);
      else clearTimeout(handle as number);
    };
  }, [branding.faviconUrl]);

  return null;
};
