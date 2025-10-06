-- ============================================================================
-- CRITICAL SECURITY FIX: Move roles to separate table to prevent privilege escalation
-- ============================================================================

-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'content_creator', 'traveler');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create SECURITY DEFINER function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role::text::app_role
FROM public.profiles
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Update is_admin() function to use new user_roles table
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role($1, 'admin');
$$;

-- ============================================================================
-- FIX: Guest Review Email Exposure (ERROR - Critical Privacy Violation)
-- ============================================================================

-- Create public view that excludes email addresses
CREATE VIEW public.public_guest_reviews AS 
SELECT 
  id, 
  guide_id, 
  name, 
  comment, 
  rating,
  is_approved,
  created_at,
  updated_at,
  status
FROM public.guest_reviews 
WHERE status = 'approved';

-- Grant access to the view
GRANT SELECT ON public.public_guest_reviews TO anon, authenticated;

-- ============================================================================
-- FIX: Input Validation for Guest Reviews (WARN - Injection Prevention)
-- ============================================================================

-- Add server-side validation trigger
CREATE OR REPLACE FUNCTION public.validate_guest_review()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate name length
  IF length(trim(NEW.name)) < 2 OR length(trim(NEW.name)) > 100 THEN
    RAISE EXCEPTION 'Name must be between 2 and 100 characters';
  END IF;
  
  -- Validate email format
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Validate email length
  IF length(trim(NEW.email)) < 5 OR length(trim(NEW.email)) > 254 THEN
    RAISE EXCEPTION 'Email must be between 5 and 254 characters';
  END IF;
  
  -- Validate comment length
  IF length(trim(NEW.comment)) < 10 OR length(trim(NEW.comment)) > 2000 THEN
    RAISE EXCEPTION 'Comment must be between 10 and 2000 characters';
  END IF;
  
  -- Basic spam filtering
  IF NEW.comment ~* '(viagra|casino|loan|crypto|bitcoin|investment|forex|buy now|click here)' THEN
    RAISE EXCEPTION 'Comment contains prohibited content';
  END IF;
  
  -- Sanitize inputs
  NEW.name := trim(NEW.name);
  NEW.email := lower(trim(NEW.email));
  NEW.comment := trim(NEW.comment);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_guest_review_before_insert ON public.guest_reviews;
CREATE TRIGGER validate_guest_review_before_insert
BEFORE INSERT ON public.guest_reviews
FOR EACH ROW EXECUTE FUNCTION public.validate_guest_review();

-- ============================================================================
-- UPDATE: RLS Policies to use new has_role() function
-- ============================================================================

-- Update admin-related RLS policies to use has_role()
-- Note: We're keeping the profile.role column for now for backwards compatibility
-- but all security checks now use the user_roles table

-- Example updates for critical tables (you may need to update more based on your needs)

-- Update profiles admin policies
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update audio_guides admin policies
DROP POLICY IF EXISTS "Admins can delete all guides" ON public.audio_guides;
CREATE POLICY "Admins can delete all guides"
ON public.audio_guides FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update all guides" ON public.audio_guides;
CREATE POLICY "Admins can update all guides"
ON public.audio_guides FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all guides" ON public.audio_guides;
CREATE POLICY "Admins can view all guides"
ON public.audio_guides FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));