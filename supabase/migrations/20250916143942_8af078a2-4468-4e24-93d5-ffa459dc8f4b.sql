-- Create new version of get_guide_with_access to fix ambiguous column references
CREATE OR REPLACE FUNCTION public.get_guide_with_access_v2(p_access_code text, p_guide_id uuid)
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  location text,
  image_url text,
  creator_id uuid,
  duration integer,
  price_usd integer,
  currency text,
  languages text[],
  category text,
  difficulty text,
  rating numeric,
  total_reviews integer,
  is_published boolean,
  is_approved boolean,
  master_access_code text,
  slug text,
  sections jsonb,
  qr_code_url text,
  share_url text,
  admin_qr_code_url text,
  admin_share_url text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check access using master code or purchase code
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.audio_guides ag
      WHERE ag.id = p_guide_id AND ag.master_access_code = p_access_code
    )
    OR EXISTS (
      SELECT 1 FROM public.user_purchases up
      WHERE up.guide_id = p_guide_id AND up.access_code = p_access_code
    )
  ) THEN
    RETURN;
  END IF;

  -- Return guide data with explicit aliases
  RETURN QUERY
  SELECT 
    ag.id,
    ag.title,
    ag.description,
    ag.location,
    ag.image_url,
    ag.creator_id,
    ag.duration,
    ag.price_usd,
    ag.currency,
    ag.languages,
    ag.category,
    ag.difficulty,
    ag.rating,
    ag.total_reviews,
    ag.is_published,
    ag.is_approved,
    ag.master_access_code,
    ag.slug,
    ag.sections,
    ag.qr_code_url,
    ag.share_url,
    ag.admin_qr_code_url,
    ag.admin_share_url,
    ag.created_at,
    ag.updated_at
  FROM public.audio_guides ag
  WHERE ag.id = p_guide_id;
END;
$$;

-- Grant execute permissions to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_guide_with_access_v2(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_guide_with_access_v2(text, uuid) TO authenticated;

-- Re-grant permissions for existing functions to ensure they work properly
GRANT EXECUTE ON FUNCTION public.get_full_linked_guides_with_access(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_full_linked_guides_with_access(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sections_with_access(uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_sections_with_access(uuid, text, text) TO authenticated;