-- Add new professional fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN guide_country TEXT,
ADD COLUMN license_country TEXT,
ADD COLUMN license_type TEXT,
ADD COLUMN languages_spoken TEXT[] DEFAULT '{}',
ADD COLUMN certifications JSONB DEFAULT '{}';

-- Create profile privacy settings table
CREATE TABLE public.profile_privacy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  show_social_media BOOLEAN NOT NULL DEFAULT false,
  show_experience_years BOOLEAN NOT NULL DEFAULT true,
  show_certifications BOOLEAN NOT NULL DEFAULT true,
  show_languages BOOLEAN NOT NULL DEFAULT true,
  show_guide_country BOOLEAN NOT NULL DEFAULT true,
  show_license_info BOOLEAN NOT NULL DEFAULT true,
  allow_public_messaging BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on privacy settings
ALTER TABLE public.profile_privacy_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for privacy settings
CREATE POLICY "Users can view their own privacy settings" 
ON public.profile_privacy_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings" 
ON public.profile_privacy_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings" 
ON public.profile_privacy_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create trigger for privacy settings timestamps
CREATE TRIGGER update_profile_privacy_settings_updated_at
BEFORE UPDATE ON public.profile_privacy_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table to make social_profiles private by default
UPDATE public.profiles 
SET social_profiles = '{}' 
WHERE social_profiles IS NULL;