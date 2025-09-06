-- Fix security warnings by setting search_path for all functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_guide_rating()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_purchase_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'ART-' || upper(substring(gen_random_uuid()::text from 1 for 8));
END;
$$ LANGUAGE plpgsql SET search_path = public;