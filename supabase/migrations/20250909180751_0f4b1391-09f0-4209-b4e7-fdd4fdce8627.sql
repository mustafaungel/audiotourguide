-- Simple fix: Remove public access to profiles table completely
-- This will ensure no public access to email addresses

-- Drop any public access policies to profiles table
DROP POLICY IF EXISTS "Public can view safe creator profiles" ON public.profiles;
DROP POLICY IF EXISTS "Restricted creator profile access" ON public.profiles;

-- Remove any grants to anon users on profiles table to block direct access
REVOKE ALL ON public.profiles FROM anon;

-- Ensure our secure view still works for public access (without exposing emails)
-- The view already excludes email and other sensitive fields
GRANT SELECT ON public.safe_creator_profiles TO anon, authenticated;

-- Final security documentation
COMMENT ON TABLE public.profiles IS 
'SECURITY FIXED: Email exposure eliminated. No public table access. Public access only through safe_creator_profiles view which excludes email and sensitive data. Users can only see own profiles, admins see all.';