-- Final fix: Ensure the profiles table doesn't expose emails in ANY way
-- The scanner is still detecting email exposure, so we need to be more aggressive

-- Check current policies
SELECT policy_name, cmd, qual FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';

-- Drop ALL public access policies to profiles table
DROP POLICY IF EXISTS "Public can view safe creator profiles" ON public.profiles;

-- Create a much more restrictive policy that only allows specific safe queries
-- This policy should NEVER allow direct access to email fields
CREATE POLICY "Restricted creator profile access" 
ON public.profiles 
FOR SELECT 
USING (
  -- Only allow access through our secure view by checking the query pattern
  -- This is a restrictive approach that forces use of our safe view
  false  -- No direct table access allowed
);

-- The safe_creator_profiles view will work because it uses security_invoker
-- and the service role will be able to read the underlying data
-- But direct queries to profiles table will be blocked

-- Add RLS policy specifically for admins and users accessing their own data
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin());

-- Keep the existing policies for inserts and updates
-- (these should already exist and be secure)

-- Add final security documentation
COMMENT ON TABLE public.profiles IS 
'CRITICAL SECURITY: Email addresses and sensitive data are protected. Public access ONLY through safe_creator_profiles view. Direct table queries blocked for public. Use get_safe_creator_profile() function for rate-limited access.';

-- Test that our view still works by granting explicit permissions
-- The view needs to be accessible but the underlying table is protected
GRANT SELECT ON public.safe_creator_profiles TO anon, authenticated;

-- Ensure no other permissions exist on the profiles table for anon users
REVOKE ALL ON public.profiles FROM anon;
-- Allow authenticated users to see their own profiles only (handled by RLS)