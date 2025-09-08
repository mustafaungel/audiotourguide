-- SECURITY FIX: Part 2 - Complete cleanup of user_purchases RLS policies
-- Drop ALL existing policies to start fresh

DROP POLICY IF EXISTS "Admin view all purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Admins can view all purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Allow access code verification for guest purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Authenticated users can insert their own purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Secure user purchases insert" ON public.user_purchases;
DROP POLICY IF EXISTS "Secure user purchases view" ON public.user_purchases;
DROP POLICY IF EXISTS "Service role can manage all purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users can view their own purchases only" ON public.user_purchases;

-- Now create the secure policies from scratch

-- Policy 1: Admins can manage all purchases
CREATE POLICY "Admins can manage all purchases"
ON public.user_purchases
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy 2: Service role can manage all purchases (for payment processing)
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

-- Note: No guest access policy - guests must use secure functions instead