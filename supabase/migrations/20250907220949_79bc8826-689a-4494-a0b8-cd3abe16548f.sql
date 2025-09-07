-- Add guest_email column to user_purchases table and make user_id nullable for guest purchases
ALTER TABLE public.user_purchases 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.user_purchases 
ADD COLUMN guest_email TEXT;

-- Update RLS policies to support guest purchases
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.user_purchases;

-- Create new policies that support both authenticated users and guests
CREATE POLICY "Users can view their own purchases" 
ON public.user_purchases 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (user_id IS NULL AND guest_email IS NOT NULL)
);

CREATE POLICY "Users can insert their own purchases" 
ON public.user_purchases 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  (user_id IS NULL AND guest_email IS NOT NULL)
);

-- Service role can manage all purchases (for edge functions)
CREATE POLICY "Service role can manage all purchases" 
ON public.user_purchases 
FOR ALL 
USING (auth.role() = 'service_role');