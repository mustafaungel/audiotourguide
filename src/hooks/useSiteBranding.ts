import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SiteBranding {
  logoUrl: string | null;
  darkLogoUrl: string | null;
  faviconUrl: string | null;
  companyName: string;
}

export const useSiteBranding = () => {
  const [branding, setBranding] = useState<SiteBranding>({
    logoUrl: null,
    darkLogoUrl: null,
    faviconUrl: null,
    companyName: 'Audio Guides'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBranding();
  }, []);

  const loadBranding = async () => {
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
        const cacheBuster = `?v=${Date.now()}`;
        switch (setting.setting_key) {
          case 'site_logo_url':
            acc.logoUrl = setting.setting_value ? `${setting.setting_value}${cacheBuster}` : null;
            break;
          case 'site_logo_dark_url':
            acc.darkLogoUrl = setting.setting_value ? `${setting.setting_value}${cacheBuster}` : null;
            break;
          case 'site_favicon_url':
            acc.faviconUrl = setting.setting_value ? `${setting.setting_value}${cacheBuster}` : null;
            break;
          case 'company_name':
            acc.companyName = setting.setting_value || 'Audio Guides';
            break;
        }
        return acc;
      }, {
        logoUrl: null,
        darkLogoUrl: null,
        faviconUrl: null,
        companyName: 'Audio Guides'
      } as SiteBranding);

      setBranding(brandingData);
    } catch (err: any) {
      console.error('Error loading site branding:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBranding = async (settingKey: string, settingValue: string | null) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ 
          setting_value: settingValue,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingKey);

      if (error) throw error;

      // Update local state
      setBranding(prev => {
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
  };

  return {
    branding,
    loading,
    error,
    updateBranding,
    refreshBranding: loadBranding
  };
};