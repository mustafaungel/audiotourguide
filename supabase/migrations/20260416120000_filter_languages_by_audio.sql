-- Only show languages that have at least one section with audio uploaded
-- This hides languages where only scripts exist but no audio yet
CREATE OR REPLACE FUNCTION public.get_guide_languages(p_guide_id uuid)
RETURNS TABLE(language_code text, language_name text, native_name text, section_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    sl.code,
    sl.name,
    sl.native_name,
    COUNT(gs.id)::INTEGER as section_count
  FROM public.supported_languages sl
  LEFT JOIN public.guide_sections gs
    ON gs.language_code = sl.code
    AND gs.guide_id = p_guide_id
    AND gs.audio_url IS NOT NULL
  WHERE sl.is_active = true
  GROUP BY sl.code, sl.name, sl.native_name
  HAVING COUNT(gs.id) > 0
  ORDER BY section_count DESC, sl.code ASC;
END;
$function$;
