-- SECURITY FIX: Protect customer email addresses in user_purchases table
-- This migration fixes the critical security vulnerability where guest emails were exposed

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Allow access code verification for guest purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Authenticated users can insert their own purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Secure user purchases insert" ON public.user_purchases;
DROP POLICY IF EXISTS "Secure user purchases view" ON public.user_purchases;
DROP POLICY IF EXISTS "Users can view their own purchases only" ON public.user_purchases;
DROP POLICY IF EXISTS "Admin view all purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.user_purchases;

-- Step 2: Create a secure function to verify access codes without exposing emails
CREATE OR REPLACE FUNCTION public.verify_access_code_secure(p_access_code text, p_guide_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if access code exists for the guide without exposing any personal data
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_purchases 
    WHERE access_code = p_access_code 
    AND guide_id = p_guide_id
  );
END;
$$;

-- Step 3: Create secure RLS policies

-- Policy 1: Admins can view all purchases (consolidated)
CREATE POLICY "Admins can manage all purchases"
ON public.user_purchases
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy 2: Service role can manage all purchases (for system operations)
CREATE POLICY "Service role can manage all purchases"
ON public.user_purchases
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Policy 3: Authenticated users can insert their own purchases
CREATE POLICY "Users can insert their own purchases"
ON public.user_purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can view their own authenticated purchases
CREATE POLICY "Users can view their own authenticated purchases"
ON public.user_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Step 4: Create a secure function to get purchase info for guests (without emails)
CREATE OR REPLACE FUNCTION public.get_guest_purchase_info(p_access_code text, p_guide_id uuid)
RETURNS TABLE(
  id uuid,
  guide_id uuid,
  access_code text,
  purchase_date timestamp with time zone,
  price_paid integer,
  currency text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the access code and guide match, but don't expose email
  RETURN QUERY
  SELECT 
    up.id,
    up.guide_id,
    up.access_code,
    up.purchase_date,
    up.price_paid,
    up.currency
  FROM public.user_purchases up
  WHERE up.access_code = p_access_code 
    AND up.guide_id = p_guide_id
    AND up.user_id IS NULL;
END;
$$;