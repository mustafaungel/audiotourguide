-- Create creator tier definitions table
CREATE TABLE public.creator_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL UNIQUE,
  required_points INTEGER NOT NULL,
  tier_color TEXT NOT NULL DEFAULT '#gray',
  tier_description TEXT,
  benefits JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add tier-related columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN current_tier TEXT DEFAULT 'bronze',
ADD COLUMN tier_points INTEGER DEFAULT 0,
ADD COLUMN tier_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create tier history table
CREATE TABLE public.tier_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  previous_tier TEXT,
  new_tier TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.creator_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tier_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for creator_tiers
CREATE POLICY "Anyone can view creator tiers" 
ON public.creator_tiers 
FOR SELECT 
USING (true);

-- RLS policies for tier_history
CREATE POLICY "Users can view their own tier history" 
ON public.tier_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage tier history" 
ON public.tier_history 
FOR ALL 
USING (auth.role() = 'service_role');

-- Insert default tier definitions
INSERT INTO public.creator_tiers (tier_name, tier_level, required_points, tier_color, tier_description, benefits) VALUES
('bronze', 1, 0, '#CD7F32', 'Starting tier for new creators', '["Basic profile features", "Standard discovery"]'),
('silver', 2, 100, '#C0C0C0', 'Established creators with proven track record', '["Enhanced profile visibility", "Priority in search results", "Basic analytics"]'),
('gold', 3, 500, '#FFD700', 'Experienced creators with excellent ratings', '["Featured in discovery", "Advanced analytics", "Custom branding options", "Priority support"]'),
('diamond', 4, 1500, '#B9F2FF', 'Elite creators with exceptional performance', '["Premium placement", "Advanced tools", "Revenue optimization", "Exclusive features", "Dedicated support"]');

-- Create function to calculate tier points
CREATE OR REPLACE FUNCTION public.calculate_tier_points(creator_user_id UUID)
RETURNS INTEGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update creator tier
CREATE OR REPLACE FUNCTION public.update_creator_tier(creator_user_id UUID)
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;