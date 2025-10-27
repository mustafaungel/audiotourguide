-- Fix ambiguous column reference in get_linked_guide_sections_with_access function
CREATE OR REPLACE FUNCTION public.get_linked_guide_sections_with_access(
  p_main_guide_id uuid,
  p_linked_guide_id uuid,
  p_access_code text,
  p_language_code text DEFAULT 'en'::text
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Verify access using either master code or purchase code for the MAIN guide
  IF NOT (
    -- Check master access code on main guide
    EXISTS (
      SELECT 1 FROM public.audio_guides 
      WHERE audio_guides.id = p_main_guide_id 
      AND audio_guides.master_access_code = p_access_code
    )
    OR
    -- Check purchase access code for main guide
    EXISTS (
      SELECT 1 FROM public.user_purchases 
      WHERE user_purchases.guide_id = p_main_guide_id 
      AND user_purchases.access_code = p_access_code
    )
  ) THEN
    -- No valid access, return nothing
    RETURN;
  END IF;
  
  -- Return guide sections for the LINKED guide bypassing RLS
  RETURN QUERY
  SELECT 
    gs.id,
    gs.guide_id,
    gs.title,
    gs.description,
    gs.audio_url,
    gs.duration_seconds,
    gs.language,
    gs.language_code,
    gs.order_index,
    gs.is_original,
    gs.original_section_id,
    gs.created_at,
    gs.updated_at
  FROM public.guide_sections gs
  WHERE gs.guide_id = p_linked_guide_id
    AND gs.language_code = p_language_code
  ORDER BY gs.order_index ASC;
END;
$function$;