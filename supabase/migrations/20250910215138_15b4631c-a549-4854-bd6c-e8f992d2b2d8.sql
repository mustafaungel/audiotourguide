-- Clean up storage logos and deployment flags, keep only static asset logos
-- Remove storage logo entries and reset to use static assets
UPDATE site_settings 
SET 
  setting_value = '/src/assets/logo-cultural-heritage.png',
  description = 'Main site logo URL from static assets',
  updated_at = now()
WHERE setting_key = 'site_logo_url';

-- Update dark logo to use the same static asset (or a specific dark version if exists)
UPDATE site_settings 
SET 
  setting_value = '/src/assets/logo-cultural-heritage.png',
  description = 'Main site logo URL for dark theme from static assets',
  updated_at = now()
WHERE setting_key = 'site_logo_dark_url';

-- Add proper favicon from static assets
UPDATE site_settings 
SET 
  setting_value = '/favicon.ico',
  description = 'Site favicon from static assets',
  updated_at = now()
WHERE setting_key = 'site_favicon_url';

-- Remove deployment flag to prevent auto-deployment
DELETE FROM site_settings WHERE setting_key = 'logo_deployed';