-- Create site_settings table for logo and branding management
CREATE TABLE public.site_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type TEXT NOT NULL DEFAULT 'text',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view active site settings" 
ON public.site_settings 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage all site settings" 
ON public.site_settings 
FOR ALL 
USING (is_admin())
WITH CHECK (is_admin());

-- Insert default logo settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description, is_active) VALUES
('site_logo_url', NULL, 'url', 'Main website logo URL', true),
('site_logo_dark_url', NULL, 'url', 'Dark theme website logo URL', true),
('site_favicon_url', NULL, 'url', 'Website favicon URL', true),
('company_name', 'AudioTour', 'text', 'Company/Site name', true);

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();