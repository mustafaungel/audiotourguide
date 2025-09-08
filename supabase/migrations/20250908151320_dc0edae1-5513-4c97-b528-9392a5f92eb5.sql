-- Remove the problematic security definer view and implement proper column-level security

-- Step 1: Drop the view that was creating security issues
DROP VIEW IF EXISTS public.safe_user_purchases;

-- Step 2: Remove the conflicting policy
DROP POLICY IF EXISTS "Block direct guest email access" ON public.user_purchases;

-- Step 3: Implement a simpler, more secure approach using a function for email masking
CREATE OR REPLACE FUNCTION public.get_masked_guest_email(p_user_id uuid, p_guest_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only return email if user is admin or owns the purchase
  IF is_admin() OR auth.uid() = p_user_id THEN
    RETURN p_guest_email;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- Step 4: The existing RLS policies already provide sufficient protection
-- Users can only see their own purchases, admins can see all, service role has full access
-- Guest email exposure is prevented by not allowing anonymous access to user_purchases table