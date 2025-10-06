-- ============================================
-- Fix Guest Reviews Email Exposure
-- ============================================

-- 1. Drop the permissive public SELECT policy that exposes emails
DROP POLICY IF EXISTS "Approved guest reviews are viewable by everyone" ON guest_reviews;

-- 2. Create admin-only SELECT policy for guest_reviews table
CREATE POLICY "Admins can view all guest reviews with emails"
ON guest_reviews FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Ensure the public_guest_reviews view has proper grants
GRANT SELECT ON public.public_guest_reviews TO anon, authenticated;

-- 4. Add comment to make intent clear
COMMENT ON TABLE guest_reviews IS 'Guest reviews with sensitive data (emails). Admins only. Public should use public_guest_reviews view.';
COMMENT ON VIEW public_guest_reviews IS 'Public-safe view of approved guest reviews without email addresses.';

-- ============================================
-- Handle Legacy Role Column in Profiles
-- ============================================

-- Option: Add deprecation warning comment
COMMENT ON COLUMN profiles.role IS 'DEPRECATED: Use user_roles table and has_role() function instead. This column is maintained for legacy compatibility only and should not be used for authorization checks.';

-- ============================================
-- Update Guest Reviews Admin Policies to Use has_role()
-- ============================================

-- Drop old admin policies that reference profiles.role directly
DROP POLICY IF EXISTS "Admins can delete guest reviews" ON guest_reviews;
DROP POLICY IF EXISTS "Admins can update guest reviews" ON guest_reviews;
DROP POLICY IF EXISTS "Admins can view all guest reviews" ON guest_reviews;

-- Recreate with proper has_role() function
CREATE POLICY "Admins can delete guest reviews"
ON guest_reviews FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update guest reviews"
ON guest_reviews FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- Update User Purchases Admin Policy
-- ============================================

-- Drop old admin policy
DROP POLICY IF EXISTS "Admins can manage all purchases" ON user_purchases;

-- Recreate with proper has_role() function
CREATE POLICY "Admins can manage all purchases"
ON user_purchases
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));