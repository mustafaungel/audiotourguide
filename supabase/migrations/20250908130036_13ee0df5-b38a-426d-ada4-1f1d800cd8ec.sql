-- Fix remaining database functions that are missing search_path settings
-- These functions were identified by the security linter

-- Update the update_verification_requests_updated_at function
CREATE OR REPLACE FUNCTION public.update_verification_requests_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Update track_viral_share function
CREATE OR REPLACE FUNCTION public.track_viral_share(p_guide_id uuid, p_platform text, p_location text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert viral share record
  INSERT INTO public.viral_shares (guide_id, user_id, platform, location)
  VALUES (p_guide_id, auth.uid(), p_platform, p_location);
  
  -- Update daily metrics
  INSERT INTO public.viral_metrics (guide_id, date, shares_count)
  VALUES (p_guide_id, CURRENT_DATE, 1)
  ON CONFLICT (guide_id, date)
  DO UPDATE SET 
    shares_count = public.viral_metrics.shares_count + 1,
    updated_at = now();
END;
$$;

-- Update track_guide_view function
CREATE OR REPLACE FUNCTION public.track_guide_view(p_guide_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update daily metrics
  INSERT INTO public.viral_metrics (guide_id, date, views_count)
  VALUES (p_guide_id, CURRENT_DATE, 1)
  ON CONFLICT (guide_id, date)
  DO UPDATE SET 
    views_count = public.viral_metrics.views_count + 1,
    updated_at = now();
END;
$$;

-- Update approve_destination function
CREATE OR REPLACE FUNCTION public.approve_destination(destination_id uuid, admin_notes text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve destinations';
  END IF;
  
  -- Update the destination
  UPDATE public.destinations 
  SET 
    is_approved = true,
    approved_by = auth.uid(),
    approved_at = now(),
    updated_at = now()
  WHERE id = destination_id AND is_approved = false;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Destination not found or already approved';
  END IF;
  
  RETURN true;
END;
$$;

-- Update approve_creator_verification function
CREATE OR REPLACE FUNCTION public.approve_creator_verification(request_id uuid, admin_notes_param text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_user_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can approve verification requests';
  END IF;
  
  -- Get the user_id from the request
  SELECT user_id INTO request_user_id 
  FROM public.verification_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF request_user_id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found or already processed';
  END IF;
  
  -- Update the verification request
  UPDATE public.verification_requests 
  SET 
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = admin_notes_param,
    updated_at = now()
  WHERE id = request_id;
  
  -- Update the user profile
  UPDATE public.profiles 
  SET 
    role = 'content_creator',
    verification_status = 'verified',
    verified_at = now(),
    creator_badge = true,
    updated_at = now()
  WHERE user_id = request_user_id;
  
  RETURN true;
END;
$$;

-- Update reject_creator_verification function
CREATE OR REPLACE FUNCTION public.reject_creator_verification(request_id uuid, rejection_reason_param text, admin_notes_param text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  request_user_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject verification requests';
  END IF;
  
  -- Get the user_id from the request
  SELECT user_id INTO request_user_id 
  FROM public.verification_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF request_user_id IS NULL THEN
    RAISE EXCEPTION 'Verification request not found or already processed';
  END IF;
  
  -- Update the verification request
  UPDATE public.verification_requests 
  SET 
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    admin_notes = admin_notes_param,
    updated_at = now()
  WHERE id = request_id;
  
  -- Update the user profile
  UPDATE public.profiles 
  SET 
    verification_status = 'rejected',
    rejection_reason = rejection_reason_param,
    updated_at = now()
  WHERE user_id = request_user_id;
  
  RETURN true;
END;
$$;

-- Update update_creator_tier function
CREATE OR REPLACE FUNCTION public.update_creator_tier(creator_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_points INTEGER;
  new_tier TEXT;
  old_tier TEXT;
BEGIN
  -- Calculate current points
  current_points := public.calculate_tier_points(creator_user_id);
  
  -- Get current tier
  SELECT current_tier INTO old_tier 
  FROM public.profiles 
  WHERE user_id = creator_user_id;
  
  -- Determine new tier based on points
  SELECT tier_name INTO new_tier
  FROM public.creator_tiers
  WHERE required_points <= current_points
  ORDER BY required_points DESC
  LIMIT 1;
  
  -- Update profile with new tier and points
  UPDATE public.profiles 
  SET 
    current_tier = new_tier,
    tier_points = current_points,
    tier_updated_at = now(),
    updated_at = now()
  WHERE user_id = creator_user_id;
  
  -- Log tier change if different
  IF old_tier IS DISTINCT FROM new_tier THEN
    INSERT INTO public.tier_history (user_id, previous_tier, new_tier, points_earned, reason)
    VALUES (creator_user_id, old_tier, new_tier, current_points, 'Automatic tier calculation');
  END IF;
  
  RETURN new_tier;
END;
$$;