-- CRITICAL SECURITY FIXES - Handle existing policies properly

-- Create a security definer function to check if user is admin (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND profiles.role = 'admin'
  );
$$;

-- Add admin policies for profiles (these are missing critical admin access)
DO $$
BEGIN
  -- Add admin view policy if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles') THEN
    EXECUTE 'CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin())';
  END IF;
  
  -- Add admin update policy if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles') THEN
    EXECUTE 'CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;
END $$;

-- Secure user_purchases table with proper access controls
-- Drop and recreate policies with proper names to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.user_purchases;

-- Create secure policies for user_purchases
CREATE POLICY "Secure user purchases view"
ON public.user_purchases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Secure user purchases insert"
ON public.user_purchases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin view all purchases"
ON public.user_purchases
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Harden all database functions with proper search_path to prevent SQL injection

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Update update_guide_rating function
CREATE OR REPLACE FUNCTION public.update_guide_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.audio_guides 
  SET 
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1) 
      FROM public.guide_reviews 
      WHERE guide_id = COALESCE(NEW.guide_id, OLD.guide_id)
    ),
    total_reviews = (
      SELECT COUNT(*) 
      FROM public.guide_reviews 
      WHERE guide_id = COALESCE(NEW.guide_id, OLD.guide_id)
    ),
    updated_at = now()
  WHERE id = COALESCE(NEW.guide_id, OLD.guide_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update update_purchase_count function
CREATE OR REPLACE FUNCTION public.update_purchase_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.audio_guides 
  SET 
    total_purchases = (
      SELECT COUNT(*) 
      FROM public.user_purchases 
      WHERE guide_id = NEW.guide_id
    ),
    updated_at = now()
  WHERE id = NEW.guide_id;
  RETURN NEW;
END;
$$;

-- Update connect_user_to_creator function with proper search_path
CREATE OR REPLACE FUNCTION public.connect_user_to_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  guide_creator_id UUID;
BEGIN
  -- Only create connection for authenticated users (not guest purchases)
  IF NEW.user_id IS NOT NULL THEN
    -- Get the creator_id from the purchased guide
    SELECT creator_id INTO guide_creator_id
    FROM public.audio_guides
    WHERE id = NEW.guide_id;
    
    -- Create connection if it doesn't exist
    INSERT INTO public.creator_connections (user_id, creator_id, guide_id, connection_source)
    VALUES (NEW.user_id, guide_creator_id, NEW.guide_id, 'purchase')
    ON CONFLICT (user_id, creator_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update generate_access_code function
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN 'ART-' || upper(substring(gen_random_uuid()::text from 1 for 8));
END;
$$;

-- Update creator rating functions
CREATE OR REPLACE FUNCTION public.update_creator_ratings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update service ratings aggregate
  UPDATE public.profiles 
  SET 
    service_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
      FROM public.creator_service_ratings 
      WHERE creator_id = COALESCE(NEW.creator_id, OLD.creator_id)
    ),
    service_rating_count = (
      SELECT COUNT(*) 
      FROM public.creator_service_ratings 
      WHERE creator_id = COALESCE(NEW.creator_id, OLD.creator_id)
    ),
    updated_at = now()
  WHERE user_id = COALESCE(NEW.creator_id, OLD.creator_id);
  
  -- Update platform ratings aggregate
  UPDATE public.profiles 
  SET 
    platform_rating = (
      SELECT ROUND(AVG(rating)::numeric, 2) 
      FROM public.creator_platform_ratings 
      WHERE creator_id = COALESCE(NEW.creator_id, OLD.creator_id)
    ),
    platform_rating_count = (
      SELECT COUNT(*) 
      FROM public.creator_platform_ratings 
      WHERE creator_id = COALESCE(NEW.creator_id, OLD.creator_id)
    ),
    updated_at = now()
  WHERE user_id = COALESCE(NEW.creator_id, OLD.creator_id);
  
  -- Calculate combined rating
  UPDATE public.profiles 
  SET 
    combined_rating = (
      CASE 
        WHEN service_rating > 0 AND platform_rating > 0 THEN
          ROUND((service_rating * 0.7 + platform_rating * 0.3)::numeric, 2)
        WHEN service_rating > 0 THEN service_rating
        WHEN platform_rating > 0 THEN platform_rating
        ELSE 0
      END
    ),
    updated_at = now()
  WHERE user_id = COALESCE(NEW.creator_id, OLD.creator_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update calculate_tier_points function
CREATE OR REPLACE FUNCTION public.calculate_tier_points(creator_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  points INTEGER := 0;
  profile_record RECORD;
  guide_stats RECORD;
  booking_stats RECORD;
  review_stats RECORD;
BEGIN
  -- Get profile information
  SELECT experience_years, verification_status, creator_badge 
  INTO profile_record
  FROM public.profiles 
  WHERE user_id = creator_user_id;
  
  -- Experience years (10 points per year, max 100)
  IF profile_record.experience_years IS NOT NULL THEN
    points := points + LEAST(profile_record.experience_years * 10, 100);
  END IF;
  
  -- Verification bonus (50 points)
  IF profile_record.verification_status = 'verified' THEN
    points := points + 50;
  END IF;
  
  -- Creator badge bonus (25 points)
  IF profile_record.creator_badge = true THEN
    points := points + 25;
  END IF;
  
  -- Guide statistics
  SELECT 
    COUNT(*) as total_guides,
    COUNT(*) FILTER (WHERE is_published = true) as published_guides,
    COALESCE(SUM(total_purchases), 0) as total_sales,
    COALESCE(AVG(rating), 0) as avg_rating
  INTO guide_stats
  FROM public.audio_guides 
  WHERE creator_id = creator_user_id;
  
  -- Published guides (20 points each, max 400)
  points := points + LEAST(guide_stats.published_guides * 20, 400);
  
  -- Guide sales (5 points per sale, max 500)
  points := points + LEAST(guide_stats.total_sales * 5, 500);
  
  -- Rating bonus (rating above 4.0 gets bonus points)
  IF guide_stats.avg_rating > 4.0 THEN
    points := points + ROUND((guide_stats.avg_rating - 4.0) * 100);
  END IF;
  
  -- Live experience bookings
  SELECT 
    COUNT(*) as total_bookings,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_bookings
  INTO booking_stats
  FROM public.experience_bookings 
  WHERE creator_id = creator_user_id;
  
  -- Confirmed bookings (15 points each, max 300)
  points := points + LEAST(booking_stats.confirmed_bookings * 15, 300);
  
  -- Community engagement (creator connections)
  SELECT COUNT(*) as followers
  INTO review_stats
  FROM public.creator_connections 
  WHERE creator_id = creator_user_id AND is_active = true;
  
  -- Followers (2 points each, max 200)
  points := points + LEAST(review_stats.followers * 2, 200);
  
  RETURN points;
END;
$$;

-- Add security audit logging table
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on security audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Create policies for security audit log
DO $$
BEGIN
  -- Only admins can view security logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_log' AND policyname = 'Admins can view security audit logs') THEN
    EXECUTE 'CREATE POLICY "Admins can view security audit logs" ON public.security_audit_log FOR SELECT TO authenticated USING (public.is_admin())';
  END IF;
  
  -- Service role can insert audit logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_audit_log' AND policyname = 'Service role can insert audit logs') THEN
    EXECUTE 'CREATE POLICY "Service role can insert audit logs" ON public.security_audit_log FOR INSERT TO service_role WITH CHECK (true)';
  END IF;
END $$;

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, resource_type, resource_id, 
    success, error_message, metadata
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id,
    p_success, p_error_message, p_metadata
  );
END;
$$;