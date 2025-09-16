-- Create secure RPC to fetch linked guide sections using main guide access
CREATE OR REPLACE FUNCTION public.get_linked_guide_sections_with_access(
  p_main_guide_id uuid,
  p_access_code text,
  p_target_guide_id uuid,
  p_language_code text DEFAULT 'en'
)
RETURNS TABLE(
  id uuid,
  guide_id uuid,
  title text,
  description text,
  audio_url text,
  duration_seconds integer,
  language text,
  language_code text,
  order_index integer,
  is_original boolean,
  original_section_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Authorize via master code or purchase on the main guide
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.audio_guides 
      WHERE id = p_main_guide_id AND master_access_code = p_access_code
    )
    OR EXISTS (
      SELECT 1 FROM public.user_purchases 
      WHERE guide_id = p_main_guide_id AND access_code = p_access_code
    )
  ) THEN
    RETURN;
  END IF;

  -- Ensure the target guide is actually linked to the main guide
  IF NOT EXISTS (
    WITH collection AS (
      SELECT linked_guides
      FROM public.guide_collections
      WHERE main_guide_id = p_main_guide_id
      LIMIT 1
    ),
    lg AS (
      SELECT (elem->>'guide_id')::uuid AS guide_id
      FROM collection, LATERAL jsonb_array_elements(linked_guides) AS elem
    )
    SELECT 1 FROM lg WHERE guide_id = p_target_guide_id
  ) THEN
    RETURN;
  END IF;

  -- Prefer requested language if available
  IF EXISTS (
    SELECT 1 FROM public.guide_sections 
    WHERE guide_id = p_target_guide_id AND language_code = p_language_code
  ) THEN
    RETURN QUERY
    SELECT 
      gs.id, gs.guide_id, gs.title, gs.description, gs.audio_url, gs.duration_seconds,
      gs.language, gs.language_code, gs.order_index, gs.is_original, gs.original_section_id,
      gs.created_at, gs.updated_at
    FROM public.guide_sections gs
    WHERE gs.guide_id = p_target_guide_id AND gs.language_code = p_language_code
    ORDER BY gs.order_index ASC;
    RETURN;
  END IF;

  -- Fallback to English if requested language not found
  IF p_language_code <> 'en' AND EXISTS (
    SELECT 1 FROM public.guide_sections 
    WHERE guide_id = p_target_guide_id AND language_code = 'en'
  ) THEN
    RETURN QUERY
    SELECT 
      gs.id, gs.guide_id, gs.title, gs.description, gs.audio_url, gs.duration_seconds,
      gs.language, gs.language_code, gs.order_index, gs.is_original, gs.original_section_id,
      gs.created_at, gs.updated_at
    FROM public.guide_sections gs
    WHERE gs.guide_id = p_target_guide_id AND gs.language_code = 'en'
    ORDER BY gs.order_index ASC;
    RETURN;
  END IF;

  -- Fallback to language with most sections
  RETURN QUERY
  WITH top_lang AS (
    SELECT language_code
    FROM public.guide_sections
    WHERE guide_id = p_target_guide_id
    GROUP BY language_code
    ORDER BY COUNT(*) DESC
    LIMIT 1
  )
  SELECT 
    gs.id, gs.guide_id, gs.title, gs.description, gs.audio_url, gs.duration_seconds,
    gs.language, gs.language_code, gs.order_index, gs.is_original, gs.original_section_id,
    gs.created_at, gs.updated_at
  FROM public.guide_sections gs
  JOIN top_lang tl ON tl.language_code = gs.language_code
  WHERE gs.guide_id = p_target_guide_id
  ORDER BY gs.order_index ASC;
END;
$$;