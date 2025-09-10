import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const AutoLogoDeployment = () => {
  const [deployed, setDeployed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAndDeployLogo();
  }, []);

  const checkAndDeployLogo = async () => {
    try {
      setLoading(true);

      // Check if logo has already been deployed
      const { data: deploymentFlag } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'logo_deployed')
        .eq('is_active', true)
        .single();

      if (deploymentFlag?.setting_value === 'true') {
        console.log('Logo already deployed, skipping...');
        setDeployed(true);
        return;
      }

      console.log('Deploying logo automatically...');

      // Call the deployment edge function
      const { data, error } = await supabase.functions.invoke('deploy-logo', {
        body: {}
      });

      if (error) {
        console.error('Logo deployment error:', error);
        return;
      }

      if (data?.success) {
        console.log('Logo deployed successfully:', data.logoUrl);
        setDeployed(true);
        
        // Reload the page to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }

    } catch (error) {
      console.error('Auto logo deployment error:', error);
    } finally {
      setLoading(false);
    }
  };

  // This component doesn't render anything visible
  if (loading) {
    console.log('Auto-deploying company logo...');
  }

  if (deployed) {
    console.log('Company logo deployed successfully!');
  }

  return null;
};