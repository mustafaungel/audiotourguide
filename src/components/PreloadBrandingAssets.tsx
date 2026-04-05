import { useEffect } from 'react';
import { useSiteBranding } from '@/hooks/useSiteBranding';

const PreloadBrandingAssets: React.FC = () => {
  const { branding } = useSiteBranding();

  useEffect(() => {
    const urls = [branding.logoUrl, branding.darkLogoUrl].filter(Boolean) as string[];
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [branding.logoUrl, branding.darkLogoUrl]);

  return null;
};

export default PreloadBrandingAssets;
