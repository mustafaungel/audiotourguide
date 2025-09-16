-- Create function to fetch linked guides with access verification
CREATE OR REPLACE FUNCTION public.get_linked_guides_with_access(
  p_guide_id uuid,
  p_access_code text
)
RETURNS TABLE(
  guide_id uuid,
  custom_title text,
  order_index integer,
  title text,
  slug text,
  master_access_code text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify access using either master code or a purchase code
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.audio_guides 
      WHERE id = p_guide_id AND master_access_code = p_access_code
    )
    OR EXISTS (
      SELECT 1 FROM public.user_purchases 
      WHERE guide_id = p_guide_id AND access_code = p_access_code
    )
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH collection AS (
    SELECT linked_guides
    FROM public.guide_collections
    WHERE main_guide_id = p_guide_id
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
    ag.master_access_code
  FROM lg
  LEFT JOIN public.audio_guides ag ON ag.id = lg.guide_id
  ORDER BY lg.order_index ASC;
END;
$$;