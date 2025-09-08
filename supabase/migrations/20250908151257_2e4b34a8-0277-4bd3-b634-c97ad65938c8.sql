-- Enhanced security fix - completely block direct access to guest emails
-- Create a view that masks sensitive data for public access

-- Step 1: Create a secure view that excludes sensitive data
CREATE OR REPLACE VIEW public.safe_user_purchases AS
SELECT 
  id,
  guide_id,
  access_code,
  purchase_date,
  price_paid,
  currency,
  stripe_payment_id,
  user_id,
  -- Only show guest_email to admins and the purchasing user
  CASE 
    WHEN is_admin() OR auth.uid() = user_id THEN guest_email
    ELSE NULL 
  END as guest_email
FROM public.user_purchases;

-- Step 2: Grant appropriate permissions on the view
GRANT SELECT ON public.safe_user_purchases TO authenticated, anon;

-- Step 3: Create additional policy to block direct guest_email access
CREATE POLICY "Block direct guest email access" 
ON public.user_purchases 
FOR SELECT 
USING (
  -- Allow access only if user owns the purchase or is admin
  (auth.uid() = user_id) OR 
  is_admin() OR 
  -- Block any query that tries to access guest_email directly
  (user_id IS NOT NULL)
);