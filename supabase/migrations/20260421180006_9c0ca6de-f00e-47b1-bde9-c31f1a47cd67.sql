DO $$
DECLARE
  v_guide_id uuid := 'd57edafb-39ab-4d95-a929-008de3c347ed';
BEGIN
  -- order=0: Introdução → PT, Introducción → ES
  UPDATE public.guide_sections SET language_code='pt', language='Portuguese'
  WHERE guide_id = v_guide_id AND title = 'Introdução' AND is_original = false;

  UPDATE public.guide_sections SET language_code='es', language='Spanish'
  WHERE guide_id = v_guide_id AND title = 'Introducción' AND is_original = false;

  -- order=1: Área de decolagem dos balões → PT
  UPDATE public.guide_sections SET language_code='pt', language='Portuguese'
  WHERE guide_id = v_guide_id AND title = 'Área de decolagem dos balões' AND is_original = false;

  -- order=2: Point panoramique de Göreme → FR
  UPDATE public.guide_sections SET language_code='fr', language='French'
  WHERE guide_id = v_guide_id AND title = 'Point panoramique de Göreme' AND is_original = false;

  -- order=3: Valle del Amor → ES (with Spanish 'del' not Italian)
  UPDATE public.guide_sections SET language_code='es', language='Spanish'
  WHERE guide_id = v_guide_id AND title = 'Valle del Amor (Bağlıdere)' AND is_original = false;

  -- Refresh languages array
  UPDATE public.audio_guides
  SET languages = ARRAY(
    SELECT DISTINCT language FROM public.guide_sections
    WHERE guide_id = v_guide_id ORDER BY language
  )
  WHERE id = v_guide_id;
END $$;