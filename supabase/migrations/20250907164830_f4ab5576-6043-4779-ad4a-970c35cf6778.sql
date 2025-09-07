-- Fix remaining function search path issues
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
$$;

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