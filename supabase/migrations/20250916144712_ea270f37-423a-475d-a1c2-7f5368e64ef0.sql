-- Create or replace comprehensive linked guides function expected by frontend
CREATE OR REPLACE FUNCTION public.get_full_linked_guides_with_access(
  p_guide_id uuid,
  p_access_code text
)
RETURNS TABLE(
  guide_id uuid,
  custom_title text,
  order_index integer,
  title text,
  slug text,
  master_access_code text,
  sections jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify access using either master code or a purchase code for the MAIN guide
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

  -- Return linked guides with explicit aliases and sections
  RETURN QUERY
  WITH collection AS (
    SELECT gc.linked_guides
    FROM public.guide_collections gc
    WHERE gc.main_guide_id = p_guide_id
    LIMIT 1
  ),
  lg AS (
    SELECT 
      (elem->>'guide_id')::uuid AS guide_id,
      elem->>'custom_title' AS custom_title,
      COALESCE((elem->>'order')::int, 0) AS order_index
    FROM collection, LATERAL jsonb_array_elements(linked_guides) AS elem
  )
  SELECT 
    lg.guide_id,
    lg.custom_title,
    lg.order_index,
    ag.title,
    ag.slug,
    ag.master_access_code,
    ag.sections
  FROM lg
  LEFT JOIN public.audio_guides ag ON ag.id = lg.guide_id
  ORDER BY lg.order_index ASC;
END;
$$;

-- Ensure execute permissions for web roles
GRANT EXECUTE ON FUNCTION public.get_full_linked_guides_with_access(uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_full_linked_guides_with_access(uuid, text) TO authenticated;