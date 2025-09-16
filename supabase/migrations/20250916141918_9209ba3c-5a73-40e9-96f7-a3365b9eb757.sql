-- Create a comprehensive RPC to get linked guides with all their sections in one call
-- This bypasses RLS for properly authenticated access codes
CREATE OR REPLACE FUNCTION public.get_full_linked_guides_with_access(p_guide_id uuid, p_access_code text)
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
SET search_path TO 'public'
AS $function$
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
  ),
  guide_sections_data AS (
    SELECT 
      lg.guide_id,
      lg.custom_title,
      lg.order_index,
      ag.title,
      ag.slug,
      ag.master_access_code,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', gs.id,
            'guide_id', gs.guide_id,
            'title', gs.title,
            'description', gs.description,
            'audio_url', gs.audio_url,
            'duration_seconds', gs.duration_seconds,
            'language', gs.language,
            'language_code', gs.language_code,
            'order_index', gs.order_index,
            'is_original', gs.is_original,
            'original_section_id', gs.original_section_id,
            'created_at', gs.created_at,
            'updated_at', gs.updated_at
          ) ORDER BY gs.order_index
        ) FILTER (WHERE gs.id IS NOT NULL),
        '[]'::jsonb
      ) as sections
    FROM lg
    LEFT JOIN public.audio_guides ag ON ag.id = lg.guide_id
    LEFT JOIN public.guide_sections gs ON gs.guide_id = lg.guide_id AND gs.language_code = 'en'
    GROUP BY lg.guide_id, lg.custom_title, lg.order_index, ag.title, ag.slug, ag.master_access_code
  )
  SELECT 
    gsd.guide_id,
    gsd.custom_title,
    gsd.order_index,
    gsd.title,
    gsd.slug,
    gsd.master_access_code,
    gsd.sections
  FROM guide_sections_data gsd
  ORDER BY gsd.order_index ASC;
END;
$function$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.get_full_linked_guides_with_access(uuid, text) TO anon, authenticated;