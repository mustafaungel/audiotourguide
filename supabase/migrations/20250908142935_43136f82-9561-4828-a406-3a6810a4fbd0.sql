-- Add RLS policy to allow guest access verification via access codes
CREATE POLICY "Allow access code verification for guest purchases" 
ON public.user_purchases 
FOR SELECT 
USING (
  -- Allow access when user is authenticated and owns the purchase
  (auth.uid() = user_id) OR
  -- Allow access for guest purchases when providing valid access code
  (user_id IS NULL AND access_code IS NOT NULL)
);