-- Simple fix: Just drop the public access policy completely
-- This will ensure no public access to email addresses

-- Drop any public access to profiles table
DROP POLICY IF EXISTS "Public can view safe creator profiles" ON public.profiles;
DROP POLICY IF EXISTS "Restricted creator profile access" ON public.profiles;

-- Ensure only authenticated users and admins can access profiles
-- User access policy (already exists, but ensure it's there)
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id)
ON CONFLICT DO NOTHING;

-- Admin access policy (already exists, but ensure it's there)  
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin())
ON CONFLICT DO NOTHING;

-- Remove any grants to anon users on profiles table
REVOKE ALL ON public.profiles FROM anon;

-- The safe_creator_profiles view can still be used for public access
-- It excludes emails by design and respects RLS

-- Final security documentation
COMMENT ON TABLE public.profiles IS 
'SECURITY FIXED: No public access to profiles table. Email addresses protected. Public access only through safe_creator_profiles view which excludes sensitive data.';