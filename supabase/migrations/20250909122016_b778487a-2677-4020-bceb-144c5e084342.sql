-- Create secure function to get guide with verified access (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_guide_with_access(p_guide_id uuid, p_access_code text)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  location text,
  duration integer,
  rating numeric,
  total_reviews integer,
  image_url text,
  image_urls text[],
  audio_url text,
  transcript text,
  sections jsonb,
  creator_id uuid,
  category text,
  difficulty text,
  languages text[],
  best_time text,
  currency text,
  price_usd integer,
  is_published boolean,
  is_approved boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- First verify access using either master code or purchase code
  IF NOT (
    -- Check master access code
    EXISTS (
      SELECT 1 FROM public.audio_guides 
      WHERE audio_guides.id = p_guide_id 
      AND audio_guides.master_access_code = p_access_code
    )
    OR
    -- Check purchase access code
    EXISTS (
      SELECT 1 FROM public.user_purchases 
      WHERE user_purchases.guide_id = p_guide_id 
      AND user_purchases.access_code = p_access_code
    )
  ) THEN
    -- No valid access, return nothing
    RETURN;
  END IF;
  
  -- Return guide data bypassing RLS
  RETURN QUERY
  SELECT 
    ag.id,
    ag.title,
    ag.description,
    ag.location,
    ag.duration,
    ag.rating,
    ag.total_reviews,
    ag.image_url,
    ag.image_urls,
    ag.audio_url,
    ag.transcript,
    ag.sections,
    ag.creator_id,
    ag.category,
    ag.difficulty,
    ag.languages,
    ag.best_time,
    ag.currency,
    ag.price_usd,
    ag.is_published,
    ag.is_approved,
    ag.created_at,
    ag.updated_at
  FROM public.audio_guides ag
  WHERE ag.id = p_guide_id;
END;
$$;