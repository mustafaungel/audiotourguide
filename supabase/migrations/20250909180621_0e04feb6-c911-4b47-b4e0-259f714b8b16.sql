-- Fix any remaining security definer views by explicitly setting SECURITY INVOKER
-- According to Supabase docs, views should use SECURITY INVOKER to respect RLS of the calling user

-- Check if our view needs to be recreated with SECURITY INVOKER
DROP VIEW IF EXISTS public.safe_creator_profiles;

-- Create the view with explicit SECURITY INVOKER to fix the linter warning
CREATE VIEW public.safe_creator_profiles 
WITH (security_invoker = true) AS
SELECT 
  user_id,
  full_name,
  bio,
  specialties,
  languages_spoken,
  guide_country,
  experience_years,
  verification_status,
  avatar_url,
  -- Remove any potentially sensitive social profile data
  CASE 
    WHEN social_profiles IS NOT NULL THEN 
      jsonb_strip_nulls(social_profiles - 'email' - 'phone' - 'personal_website')
    ELSE '{}'::jsonb 
  END as social_profiles
FROM profiles 
WHERE role = 'content_creator'::user_role 
  AND verification_status = 'verified';

-- Add security comment explaining the approach
COMMENT ON VIEW public.safe_creator_profiles IS 
'SECURITY: Public view of creator profiles that excludes email addresses and sensitive data. Uses SECURITY INVOKER to respect calling user RLS permissions. Email exposure is prevented by excluding email column from SELECT.';

-- Grant public access to the view (since it's designed for public use)
GRANT SELECT ON public.safe_creator_profiles TO anon, authenticated;