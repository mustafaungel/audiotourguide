-- Update site branding settings to use the new logo
UPDATE public.site_settings 
SET setting_value = '/logo-audio-tour-guides.png', updated_at = now()
WHERE setting_key = 'site_logo_url' AND is_active = true;

UPDATE public.site_settings 
SET setting_value = '/logo-audio-tour-guides.png', updated_at = now()
WHERE setting_key = 'site_logo_dark_url' AND is_active = true;

UPDATE public.site_settings 
SET setting_value = 'Audio Tour Guides', updated_at = now()
WHERE setting_key = 'company_name' AND is_active = true;

-- Insert settings if they don't exist
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description, is_active)
VALUES 
  ('site_logo_url', '/logo-audio-tour-guides.png', 'text', 'Main site logo URL', true),
  ('site_logo_dark_url', '/logo-audio-tour-guides.png', 'text', 'Dark theme logo URL', true),
  ('company_name', 'Audio Tour Guides', 'text', 'Company name for branding', true)
ON CONFLICT (setting_key) DO UPDATE SET
  setting_value = EXCLUDED.setting_value,
  updated_at = now();