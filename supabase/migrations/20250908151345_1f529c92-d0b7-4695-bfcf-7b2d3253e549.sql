-- SECURITY FIX: Part 3 - Force drop all policies and recreate securely
-- First, disable RLS temporarily to allow operations
ALTER TABLE public.user_purchases DISABLE ROW LEVEL SECURITY;

-- Drop all policies with CASCADE to ensure clean removal
DO $$
DECLARE 
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'user_purchases' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_purchases', policy_record.policyname);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Create secure policies that protect customer email addresses

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

-- Note: No public guest access policy to prevent email exposure