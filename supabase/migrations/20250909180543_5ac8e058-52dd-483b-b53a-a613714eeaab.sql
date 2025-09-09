-- Fix the security definer view issue
-- The linter flagged our view as potentially insecure
-- We'll convert it to a regular view and rely on RLS policies instead

-- Drop the current view 
DROP VIEW IF EXISTS public.safe_creator_profiles;

-- Create a regular view (not security definer) that relies on RLS
-- This is safer as it respects the calling user's permissions
CREATE VIEW public.safe_creator_profiles AS
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

-- Update the RLS policy to be more explicit about what can be accessed
-- This replaces the security definer approach with proper RLS
DROP POLICY IF EXISTS "Public can view safe creator profiles" ON public.profiles;

CREATE POLICY "Public can view safe creator profiles" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'content_creator'::user_role 
  AND verification_status = 'verified'
  -- The view will handle masking sensitive fields like email
  -- This policy just controls which rows are accessible
);

-- Add security comment explaining the approach
COMMENT ON VIEW public.safe_creator_profiles IS 
'SECURITY: Public view of creator profiles that excludes email addresses and sensitive data. Uses RLS policies rather than security definer for better security. All access respects calling user permissions.';

COMMENT ON POLICY "Public can view safe creator profiles" ON public.profiles IS 
'SECURITY: Allows public access to verified content creator profiles. Email and sensitive data exclusion is handled by the safe_creator_profiles view, not this policy.';

-- Update the function to include rate limiting
CREATE OR REPLACE FUNCTION public.get_safe_creator_profile(creator_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  bio text,
  specialties text[],
  languages_spoken text[],
  guide_country text,
  experience_years integer,
  verification_status text,
  avatar_url text,
  social_profiles jsonb
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check rate limit first
  IF NOT check_profile_access_rate_limit(creator_user_id) THEN
    RAISE EXCEPTION 'Rate limit exceeded for profile access';
  END IF;
  
  -- Log all public profile access attempts for security monitoring
  PERFORM log_security_event(
    auth.uid(),
    'public_creator_profile_access',
    'profiles',
    creator_user_id,
    true,
    NULL,
    jsonb_build_object(
      'accessed_creator_id', creator_user_id,
      'access_method', 'secure_public_function',
      'timestamp', now()
    )
  );
  
  -- Return only safe, non-sensitive profile data
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.bio,
    p.specialties,
    p.languages_spoken,
    p.guide_country,
    p.experience_years,
    p.verification_status,
    p.avatar_url,
    -- Filter social profiles to remove any sensitive data
    CASE 
      WHEN p.social_profiles IS NOT NULL THEN 
        jsonb_strip_nulls(p.social_profiles - 'email' - 'phone' - 'personal_website')
      ELSE '{}'::jsonb 
    END as social_profiles
  FROM profiles p
  WHERE p.user_id = creator_user_id
    AND p.role = 'content_creator'::user_role
    AND p.verification_status = 'verified';
END;
$$;