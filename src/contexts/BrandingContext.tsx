import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteBranding {
  logoUrl: string | null;
  darkLogoUrl: string | null;
  faviconUrl: string | null;
  companyName: string;
}

interface BrandingContextType {
  branding: SiteBranding;
  loading: boolean;
  error: string | null;
  updateBranding: (settingKey: string, settingValue: string | null) => Promise<boolean>;
  refreshBranding: () => Promise<void>;
}

const BRANDING_CACHE_KEY = 'site_branding_cache';

const defaultBranding: SiteBranding = {
  logoUrl: null,
  darkLogoUrl: null,
  faviconUrl: null,
  companyName: 'Audio Guides',
};

const getCachedBranding = (): SiteBranding => {
  try {
    const cached = localStorage.getItem(BRANDING_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}
  return defaultBranding;
};

const setCachedBranding = (branding: SiteBranding) => {
  try {
    localStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify(branding));
  } catch {}
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
  error: null,
  updateBranding: async () => false,
  refreshBranding: async () => {},
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cachedBranding = getCachedBranding();
  const hasCachedData = cachedBranding.logoUrl !== null || cachedBranding.companyName !== 'Audio Guides';
  const [branding, setBranding] = useState<SiteBranding>(cachedBranding);
  const [loading, setLoading] = useState(!hasCachedData);
  const [error, setError] = useState<string | null>(null);

  const loadBranding = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['site_logo_url', 'site_logo_dark_url', 'site_favicon_url', 'company_name'])
        .eq('is_active', true);

      if (error) throw error;

      const brandingData = data?.reduce((acc, setting) => {
        switch (setting.setting_key) {
          case 'site_logo_url':
            acc.logoUrl = setting.setting_value || null;
            break;
          case 'site_logo_dark_url':
            acc.darkLogoUrl = setting.setting_value || null;
            break;
          case 'site_favicon_url':
            acc.faviconUrl = setting.setting_value || null;
            break;
          case 'company_name':
            acc.companyName = setting.setting_value || 'Audio Guides';
            break;
        }
        return acc;
      }, { ...defaultBranding } as SiteBranding);

      setBranding(brandingData);
    } catch (err: any) {
      console.error('Error loading site branding:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranding();
  }, [loadBranding]);

  const updateBranding = useCallback(async (settingKey: string, settingValue: string | null) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({
          setting_value: settingValue,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      setBranding((prev) => {
        const updated = { ...prev };
        switch (settingKey) {
          case 'site_logo_url':
            updated.logoUrl = settingValue;
            break;
          case 'site_logo_dark_url':
            updated.darkLogoUrl = settingValue;
            break;
          case 'site_favicon_url':
            updated.faviconUrl = settingValue;
            break;
          case 'company_name':
            updated.companyName = settingValue || 'Audio Guides';
            break;
        }
        return updated;
      });

      return true;
    } catch (err: any) {
      console.error('Error updating site branding:', err);
      setError(err.message);
      return false;
    }
  }, []);

  return (
    <BrandingContext.Provider value={{ branding, loading, error, updateBranding, refreshBranding: loadBranding }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBrandingContext = () => useContext(BrandingContext);
