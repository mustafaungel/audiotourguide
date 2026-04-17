-- Drop both overloads explicitly
DROP FUNCTION IF EXISTS public.get_sections_with_access(uuid, text, text);
DROP FUNCTION IF EXISTS public.get_linked_guide_sections_with_access(uuid, uuid, text, text);
DROP FUNCTION IF EXISTS public.get_linked_guide_sections_with_access(uuid, text, uuid, text);
-- Variant might exist with different signature shape
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT oid::regprocedure AS sig FROM pg_proc WHERE proname = 'get_linked_guide_sections_with_access'
  LOOP
    EXECUTE 'DROP FUNCTION ' || r.sig;
  END LOOP;
END $$;

CREATE FUNCTION public.get_sections_with_access(p_guide_id uuid, p_access_code text, p_language_code text DEFAULT 'en'::text)
 RETURNS TABLE(id uuid, guide_id uuid, title text, description text, audio_url text, duration_seconds integer, language text, language_code text, order_index integer, is_original boolean, original_section_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, maps_url text)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.audio_guides WHERE id = p_guide_id AND master_access_code = p_access_code)
    OR EXISTS (SELECT 1 FROM public.user_purchases WHERE guide_id = p_guide_id AND access_code = p_access_code)
  ) THEN RETURN; END IF;

  RETURN QUERY
  SELECT gs.id, gs.guide_id, gs.title, gs.description, gs.audio_url,
         gs.duration_seconds, gs.language, gs.language_code, gs.order_index,
         gs.is_original, gs.original_section_id, gs.created_at, gs.updated_at, gs.maps_url
  FROM public.guide_sections gs
  WHERE gs.guide_id = p_guide_id AND gs.language_code = p_language_code
  ORDER BY gs.order_index ASC;
END;
$f$;

CREATE FUNCTION public.get_linked_guide_sections_with_access(
  p_main_guide_id uuid, p_target_guide_id uuid, p_access_code text, p_language_code text DEFAULT 'en'::text
)
RETURNS TABLE(id uuid, guide_id uuid, title text, description text, audio_url text,
  duration_seconds integer, language text, language_code text, order_index integer,
  is_original boolean, original_section_id uuid,
  created_at timestamp with time zone, updated_at timestamp with time zone, maps_url text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $f$
BEGIN
  IF NOT (
    EXISTS (SELECT 1 FROM public.audio_guides WHERE id = p_main_guide_id AND master_access_code = p_access_code)
    OR EXISTS (SELECT 1 FROM public.user_purchases WHERE guide_id = p_main_guide_id AND access_code = p_access_code)
  ) THEN RETURN; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.guide_collections gc
    WHERE gc.main_guide_id = p_main_guide_id
      AND gc.linked_guides @> jsonb_build_array(jsonb_build_object('guide_id', p_target_guide_id::text))
  ) THEN RETURN; END IF;

  RETURN QUERY
  SELECT gs.id, gs.guide_id, gs.title, gs.description, gs.audio_url,
         gs.duration_seconds, gs.language, gs.language_code, gs.order_index,
         gs.is_original, gs.original_section_id, gs.created_at, gs.updated_at, gs.maps_url
  FROM public.guide_sections gs
  WHERE gs.guide_id = p_target_guide_id AND gs.language_code = p_language_code
  ORDER BY gs.order_index ASC;
END;
$f$;