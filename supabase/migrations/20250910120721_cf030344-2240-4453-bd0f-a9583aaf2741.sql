-- Update light theme logo to use the same URL as dark theme logo
UPDATE public.site_settings 
SET 
  setting_value = 'https://dsaqlgxajdnwoqvtsrqd.supabase.co/storage/v1/object/public/guide-images/logos/dark-logo-1757443425034.png',
  updated_at = now()
WHERE setting_key = 'site_logo_url' AND is_active = true;