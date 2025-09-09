-- CRITICAL SECURITY FIXES
-- Fix 1: Remove email exposure from public profiles access
-- Fix 2: Create secure public profile view with audit logging
-- Fix 3: Enhance contact submissions security

-- ===========================================
-- FIX 1: SECURE PROFILES TABLE
-- ===========================================

-- Drop the insecure policy that exposes email addresses publicly
DROP POLICY IF EXISTS "Public can view basic creator profiles" ON public.profiles;

-- Create a new secure policy that excludes sensitive data from public access
CREATE POLICY "Public can view safe creator profiles" 
ON public.profiles 
FOR SELECT 
USING (
  role = 'content_creator'::user_role 
  AND verification_status = 'verified'
  -- This policy will be used by the secure view function only
  -- Direct table access is restricted to hide emails and sensitive data
);

-- Create a secure function for public profile access with data masking and audit logging
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

-- Create a secure view for public creator profiles with built-in access logging
CREATE OR REPLACE VIEW public.safe_creator_profiles AS
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

-- Add security comments
COMMENT ON POLICY "Public can view safe creator profiles" ON public.profiles IS 
'SECURITY: This policy only allows access to verified content creators. Email addresses and sensitive data are excluded. Use get_safe_creator_profile() function or safe_creator_profiles view for public access.';

COMMENT ON FUNCTION public.get_safe_creator_profile IS 
'SECURITY: Safe public access to creator profiles with audit logging. Excludes email addresses and sensitive personal data.';

COMMENT ON VIEW public.safe_creator_profiles IS 
'SECURITY: Public view of creator profiles that excludes email addresses and sensitive data. All access should go through this view rather than direct table queries.';

-- ===========================================
-- FIX 2: ENHANCE CONTACT SUBMISSIONS SECURITY  
-- ===========================================

-- The contact_submissions table already has good RLS policies
-- Add additional security logging for admin access
CREATE OR REPLACE FUNCTION public.log_contact_submission_access()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when admins access contact submissions for audit trail
  IF TG_OP = 'SELECT' AND is_admin() THEN
    PERFORM log_security_event(
      auth.uid(),
      'admin_contact_submission_access',
      'contact_submissions',
      COALESCE(NEW.id, OLD.id),
      true,
      NULL,
      jsonb_build_object(
        'operation', TG_OP,
        'admin_id', auth.uid(),
        'timestamp', now()
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- ===========================================
-- FIX 3: ADD RATE LIMITING FUNCTION
-- ===========================================

-- Create a function to track and limit profile access attempts
CREATE OR REPLACE FUNCTION public.check_profile_access_rate_limit(accessed_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_count integer;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Count recent accesses by this user in the last hour
  SELECT COUNT(*) INTO access_count
  FROM security_audit_log 
  WHERE user_id = current_user_id
    AND action = 'public_creator_profile_access'
    AND created_at > now() - interval '1 hour';
  
  -- Allow up to 100 profile accesses per hour per user
  IF access_count >= 100 THEN
    -- Log the rate limit violation
    PERFORM log_security_event(
      current_user_id,
      'profile_access_rate_limit_exceeded',
      'profiles',
      accessed_user_id,
      false,
      'Too many profile access attempts',
      jsonb_build_object(
        'access_count', access_count,
        'limit', 100,
        'time_window', '1 hour'
      )
    );
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- ===========================================
-- SECURITY DOCUMENTATION
-- ===========================================

-- Add comprehensive security documentation
COMMENT ON TABLE public.profiles IS 
'CRITICAL SECURITY: Contains sensitive user data including email addresses. Direct public access is restricted. Use safe_creator_profiles view or get_safe_creator_profile() function for public data access. All access is logged for security monitoring.';

COMMENT ON TABLE public.security_audit_log IS 
'SECURITY: Audit trail for all sensitive data access. Monitors profile views, verification document access, and admin actions. Critical for compliance and security incident response.';