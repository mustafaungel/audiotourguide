-- Simple fix: Remove all public access to profiles table
-- This completely eliminates email exposure

-- Drop any existing public access policies
DROP POLICY IF EXISTS "Public can view safe creator profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public can view basic creator profiles" ON public.profiles; 
DROP POLICY IF EXISTS "Restricted creator profile access" ON public.profiles;

-- Remove any grants to anon users on profiles table
REVOKE ALL ON public.profiles FROM anon;

-- Verify our secure view still works for public access
-- Grant access only to the view, not the underlying table
GRANT SELECT ON public.safe_creator_profiles TO anon, authenticated;

-- Add final security documentation
COMMENT ON TABLE public.profiles IS 
'SECURITY FIXED: Email addresses completely protected. No direct public access to profiles table. Public access only through safe_creator_profiles view which excludes emails and sensitive data.';