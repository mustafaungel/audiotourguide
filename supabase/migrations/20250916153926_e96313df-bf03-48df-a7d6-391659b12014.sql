-- Grant EXECUTE on helper RPCs if they exist
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_linked_guide_sections_with_access'
      AND pg_get_function_identity_arguments(p.oid) = 'p_main_guide_id uuid, p_access_code text, p_target_guide_id uuid, p_language_code text'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_linked_guide_sections_with_access(uuid, text, uuid, text) TO anon, authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_full_linked_guides_with_access'
      AND pg_get_function_identity_arguments(p.oid) = 'p_guide_id uuid, p_access_code text'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_full_linked_guides_with_access(uuid, text) TO anon, authenticated';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_linked_guides_with_access'
      AND pg_get_function_identity_arguments(p.oid) = 'p_guide_id uuid, p_access_code text'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_linked_guides_with_access(uuid, text) TO anon, authenticated';
  END IF;
END $$;