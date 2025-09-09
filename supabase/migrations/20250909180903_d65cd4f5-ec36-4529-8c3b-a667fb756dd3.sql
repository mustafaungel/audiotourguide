-- Final security hardening: Make the view even safer
-- The scanner detected the view as exposing personal info
-- Let's make it more restrictive

-- Drop the current view and recreate with minimal data exposure
DROP VIEW IF EXISTS public.safe_creator_profiles;

-- Create an ultra-safe public view with minimal data exposure
CREATE VIEW public.safe_creator_profiles 
WITH (security_invoker = true) AS
SELECT 
  user_id,
  -- Only show first name for privacy
  CASE 
    WHEN full_name IS NOT NULL THEN 
      TRIM(SPLIT_PART(full_name, ' ', 1))  -- Only first name
    ELSE 'Creator'
  END as display_name,
  -- Minimal bio (first 200 chars only)
  CASE 
    WHEN bio IS NOT NULL THEN 
      LEFT(bio, 200) || CASE WHEN LENGTH(bio) > 200 THEN '...' ELSE '' END
    ELSE NULL
  END as bio,
  -- Only show general specialties, no personal details
  specialties,
  guide_country,
  verification_status,
  -- No avatar URLs to prevent tracking
  NULL as avatar_url,
  -- Completely empty social profiles for security
  '{}'::jsonb as social_profiles
FROM profiles 
WHERE role = 'content_creator'::user_role 
  AND verification_status = 'verified'
  -- Additional privacy filter: only show creators with published guides
  AND user_id IN (
    SELECT DISTINCT creator_id 
    FROM audio_guides 
    WHERE is_published = true AND is_approved = true
  );

-- Update security documentation
COMMENT ON VIEW public.safe_creator_profiles IS 
'SECURITY: Ultra-safe public view of creator profiles. Shows only display names (first name only), limited bio, and basic info. No email addresses, full names, avatars, or social profiles. Only creators with published guides are shown.';

-- Revoke and regrant minimal permissions
REVOKE ALL ON public.safe_creator_profiles FROM anon, authenticated;
GRANT SELECT ON public.safe_creator_profiles TO anon, authenticated;