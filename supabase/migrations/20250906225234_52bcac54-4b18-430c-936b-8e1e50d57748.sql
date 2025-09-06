-- Create the missing update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create viral tracking and engagement tables
CREATE TABLE public.viral_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id UUID NOT NULL REFERENCES public.audio_guides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'twitter', 'instagram', 'whatsapp', 'native', 'copy_link')),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.viral_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id UUID NOT NULL REFERENCES public.audio_guides(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  views_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  downloads_count INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0,
  viral_score DECIMAL(10,2) DEFAULT 0,
  trending_rank INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(guide_id, date)
);

CREATE TABLE public.trending_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  coordinates POINT,
  guides_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  growth_percentage DECIMAL(5,2) DEFAULT 0,
  trending_rank INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, country)
);

CREATE TABLE public.user_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES public.audio_guides(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, guide_id)
);

CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  description TEXT,
  points INTEGER DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE public.creator_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES public.audio_guides(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  earning_type TEXT NOT NULL CHECK (earning_type IN ('purchase', 'subscription', 'tip', 'bonus')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.viral_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.viral_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trending_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view viral shares" ON public.viral_shares FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create viral shares" ON public.viral_shares FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view viral metrics" ON public.viral_metrics FOR SELECT USING (true);
CREATE POLICY "Service role can manage viral metrics" ON public.viral_metrics FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can view trending locations" ON public.trending_locations FOR SELECT USING (true);
CREATE POLICY "Service role can manage trending locations" ON public.trending_locations FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own bookmarks" ON public.user_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookmarks" ON public.user_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own bookmarks" ON public.user_bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage achievements" ON public.user_achievements FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Creators can view their own earnings" ON public.creator_earnings FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Service role can manage earnings" ON public.creator_earnings FOR ALL USING (auth.role() = 'service_role');

-- Create functions for viral tracking
CREATE OR REPLACE FUNCTION public.track_viral_share(
  p_guide_id UUID,
  p_platform TEXT,
  p_location TEXT DEFAULT NULL
) RETURNS void AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.track_guide_view(
  p_guide_id UUID
) RETURNS void AS $$
BEGIN
  -- Update daily metrics
  INSERT INTO public.viral_metrics (guide_id, date, views_count)
  VALUES (p_guide_id, CURRENT_DATE, 1)
  ON CONFLICT (guide_id, date)
  DO UPDATE SET 
    views_count = public.viral_metrics.views_count + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX idx_viral_shares_guide_platform ON public.viral_shares(guide_id, platform);
CREATE INDEX idx_viral_shares_created_at ON public.viral_shares(created_at);
CREATE INDEX idx_viral_metrics_guide_date ON public.viral_metrics(guide_id, date);
CREATE INDEX idx_viral_metrics_viral_score ON public.viral_metrics(viral_score DESC);
CREATE INDEX idx_trending_locations_rank ON public.trending_locations(trending_rank);
CREATE INDEX idx_user_bookmarks_user_guide ON public.user_bookmarks(user_id, guide_id);
CREATE INDEX idx_user_achievements_user_type ON public.user_achievements(user_id, achievement_type);
CREATE INDEX idx_creator_earnings_creator ON public.creator_earnings(creator_id, created_at);

-- Create triggers to update timestamps
CREATE TRIGGER update_viral_metrics_updated_at
  BEFORE UPDATE ON public.viral_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trending_locations_updated_at
  BEFORE UPDATE ON public.trending_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();