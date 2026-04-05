// This hook now reads from BrandingContext instead of making independent Supabase queries.
// All branding data is fetched once by BrandingProvider and shared across the app.
import { useBrandingContext } from '@/contexts/BrandingContext';

export const useSiteBranding = () => {
  return useBrandingContext();
};
