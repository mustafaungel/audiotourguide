-- Fix all remaining functions that need proper search_path settings
-- These are the functions that appear without SET search_path in the current database

-- Function that tracks viral shares
CREATE OR REPLACE FUNCTION public.track_viral_share(p_guide_id uuid, p_platform text, p_location text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Function that tracks guide views
CREATE OR REPLACE FUNCTION public.track_guide_view(p_guide_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Function that connects users to creators after purchase
CREATE OR REPLACE FUNCTION public.connect_user_to_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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