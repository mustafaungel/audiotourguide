-- Create creator_service_ratings table for user-generated ratings from actual service usage
CREATE TABLE public.creator_service_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  guide_id UUID NULL,
  experience_id UUID NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  service_category TEXT NOT NULL DEFAULT 'general', -- 'guide', 'experience', 'communication', 'overall'
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, creator_id, service_category, guide_id, experience_id)
);

-- Create creator_platform_ratings table for website-curated ratings
CREATE TABLE public.creator_platform_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  rating_category TEXT NOT NULL, -- 'expertise', 'reliability', 'content_quality', 'professionalism'
  rating NUMERIC(3,2) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  rating_notes TEXT,
  rated_by UUID NOT NULL, -- admin who gave the rating
  evidence_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_id, rating_category)
);

-- Add aggregated rating columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN service_rating NUMERIC(3,2) DEFAULT 0,
ADD COLUMN service_rating_count INTEGER DEFAULT 0,
ADD COLUMN platform_rating NUMERIC(3,2) DEFAULT 0,
ADD COLUMN platform_rating_count INTEGER DEFAULT 0,
ADD COLUMN combined_rating NUMERIC(3,2) DEFAULT 0;

-- Enable RLS on new tables
ALTER TABLE public.creator_service_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_platform_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for creator_service_ratings
CREATE POLICY "Anyone can view service ratings" 
ON public.creator_service_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own service ratings" 
ON public.creator_service_ratings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service ratings" 
ON public.creator_service_ratings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS policies for creator_platform_ratings
CREATE POLICY "Anyone can view platform ratings" 
ON public.creator_platform_ratings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage platform ratings" 
ON public.creator_platform_ratings 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Function to update creator rating aggregates
CREATE OR REPLACE FUNCTION public.update_creator_ratings()
RETURNS TRIGGER AS $$
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
  
  -- Calculate combined rating (weighted average: 70% service, 30% platform)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers for automatic rating updates
CREATE TRIGGER update_creator_service_ratings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.creator_service_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_ratings();

CREATE TRIGGER update_creator_platform_ratings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.creator_platform_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_creator_ratings();

-- Add triggers for updated_at columns
CREATE TRIGGER update_creator_service_ratings_updated_at
  BEFORE UPDATE ON public.creator_service_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_platform_ratings_updated_at
  BEFORE UPDATE ON public.creator_platform_ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();