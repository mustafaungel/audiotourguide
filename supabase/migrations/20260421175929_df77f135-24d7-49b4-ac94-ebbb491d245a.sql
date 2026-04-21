DO $$
DECLARE
  v_guide_id uuid := 'd57edafb-39ab-4d95-a929-008de3c347ed';
BEGIN
  -- Fix titles starting with Portuguese markers
  UPDATE public.guide_sections
  SET language_code = 'pt', language = 'Portuguese'
  WHERE guide_id = v_guide_id AND is_original = false
    AND (title ILIKE 'Introdução%' OR title ILIKE 'Vale do%' OR title ILIKE 'Vale da%');

  -- Spanish
  UPDATE public.guide_sections
  SET language_code = 'es', language = 'Spanish'
  WHERE guide_id = v_guide_id AND is_original = false
    AND (title ILIKE 'Introducción%' OR title ILIKE 'Valle del%' OR title ILIKE 'Valle de la%');

  -- Italian
  UPDATE public.guide_sections
  SET language_code = 'it', language = 'Italian'
  WHERE guide_id = v_guide_id AND is_original = false
    AND (title ILIKE 'Valle dell%' OR title ILIKE 'Valle d%');

  -- German (Liebestal etc.)
  UPDATE public.guide_sections
  SET language_code = 'de', language = 'German'
  WHERE guide_id = v_guide_id AND is_original = false
    AND (title ILIKE 'Liebes%' OR title ILIKE '%tal (Bağlıdere)' OR title ILIKE 'Startfeld%');

  -- Refresh languages array
  UPDATE public.audio_guides
  SET languages = ARRAY(
    SELECT DISTINCT language FROM public.guide_sections
    WHERE guide_id = v_guide_id ORDER BY language
  )
  WHERE id = v_guide_id;
END $$;