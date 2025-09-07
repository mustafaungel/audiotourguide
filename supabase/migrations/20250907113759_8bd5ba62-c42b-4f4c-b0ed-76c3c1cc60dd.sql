-- Fix security warning: Set search_path for functions to prevent SQL injection
-- Update calculate_tier_points function
CREATE OR REPLACE FUNCTION public.calculate_tier_points(creator_user_id UUID)
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
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

-- Update update_creator_tier function
CREATE OR REPLACE FUNCTION public.update_creator_tier(creator_user_id UUID)
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
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