-- Fix critical security vulnerability in user_purchases RLS policies
-- Remove the dangerous policy that allows unauthenticated access to guest purchases

-- Drop the problematic policy
DROP POLICY IF EXISTS "Prevent guest purchase data exposure" ON public.user_purchases;

-- Create a secure policy for authenticated users to access their own purchases
CREATE POLICY "Users can view own purchases only"
ON public.user_purchases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a secure policy for guest purchases (access via access code verification only)
-- This policy ensures guests can only verify their purchase exists without exposing sensitive data
CREATE POLICY "Secure guest purchase verification"
ON public.user_purchases
FOR SELECT
TO anon
USING (false); -- Completely prevent direct access for anonymous users

-- Update the admin policy to be more explicit
DROP POLICY IF EXISTS "Admins can manage all purchases" ON public.user_purchases;
CREATE POLICY "Admins can manage all purchases"
ON public.user_purchases
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Update the user insert policy to be more explicit
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.user_purchases;
CREATE POLICY "Users can insert own purchases"
ON public.user_purchases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Remove the existing "Users can view their own authenticated purchases" policy as it's redundant
DROP POLICY IF EXISTS "Users can view their own authenticated purchases" ON public.user_purchases;

-- Create a function to securely verify guest access codes without exposing sensitive data
CREATE OR REPLACE FUNCTION public.verify_guest_purchase_access(
  p_access_code text,
  p_guide_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return true/false, never expose actual purchase data
  RETURN EXISTS (
    SELECT 1 FROM public.user_purchases
    WHERE access_code = p_access_code 
    AND guide_id = p_guide_id
    AND user_id IS NULL -- Only for guest purchases
  );
END;
$$;

-- Create a function to get minimal guest purchase info (without sensitive data)
CREATE OR REPLACE FUNCTION public.get_guest_purchase_basic_info(
  p_access_code text,
  p_guide_id uuid
) RETURNS TABLE(
  guide_id uuid,
  access_code text,
  purchase_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return non-sensitive data for guest purchases
  RETURN QUERY
  SELECT 
    up.guide_id,
    up.access_code,
    up.purchase_date
  FROM public.user_purchases up
  WHERE up.access_code = p_access_code 
    AND up.guide_id = p_guide_id
    AND up.user_id IS NULL; -- Only for guest purchases
END;
$$;

-- Create audit log for purchase data access attempts
CREATE OR REPLACE FUNCTION public.log_purchase_access_attempt(
  p_access_code text,
  p_guide_id uuid,
  p_success boolean
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log all access attempts for security monitoring
  INSERT INTO public.security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    success,
    metadata
  ) VALUES (
    auth.uid(),
    'purchase_data_access_attempt',
    'user_purchases',
    p_guide_id,
    p_success,
    jsonb_build_object(
      'access_code_provided', (p_access_code IS NOT NULL),
      'guide_id', p_guide_id,
      'timestamp', now(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    )
  );
END;
$$;