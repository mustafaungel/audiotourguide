-- Scope: ONLY guide d57edafb-39ab-4d95-a929-008de3c347ed
-- Fix translated sections that were incorrectly saved with language_code='en'
-- Detection is based on character set / unique markers in titles.

DO $$
DECLARE
  v_guide_id uuid := 'd57edafb-39ab-4d95-a929-008de3c347ed';
BEGIN
  -- Russian (Cyrillic)
  UPDATE public.guide_sections
  SET language_code = 'ru', language = 'Russian'
  WHERE guide_id = v_guide_id
    AND is_original = false
    AND title ~ '[А-Яа-яЁё]';

  -- Japanese (Hiragana, Katakana, or "（" full-width parens commonly used in JP titles)
  UPDATE public.guide_sections
  SET language_code = 'ja', language = 'Japanese'
  WHERE guide_id = v_guide_id
    AND is_original = false
    AND (title ~ '[\u3040-\u309F\u30A0-\u30FF]' OR title ~ '（');

  -- Korean (Hangul)
  UPDATE public.guide_sections
  SET language_code = 'ko', language = 'Korean'
  WHERE guide_id = v_guide_id
    AND is_original = false
    AND title ~ '[\uAC00-\uD7AF]';

  -- Chinese (CJK Unified Ideographs, but exclude rows already tagged JP/KO)
  UPDATE public.guide_sections
  SET language_code = 'zh', language = 'Chinese'
  WHERE guide_id = v_guide_id
    AND is_original = false
    AND language_code = 'en'
    AND title ~ '[\u4E00-\u9FFF]';

  -- Spanish: ñ, ¡, ¿, or known Spanish words
  UPDATE public.guide_sections
  SET language_code = 'es', language = 'Spanish'
  WHERE guide_id = v_guide_id
    AND is_original = false
    AND language_code = 'en'
    AND (title ~ '[ñ¡¿]' OR title ILIKE 'Introducción%' OR title ILIKE 'Zona de%' OR title ILIKE 'Área%' OR title ILIKE 'Mirador%');

  -- Portuguese: ã, õ, ç patterns or known PT words
  UPDATE public.guide_sections
  SET language_code = 'pt', language = 'Portuguese'
  WHERE guide_id = v_guide_id
    AND is_original = false
    AND language_code = 'en'
    AND (title ~ '[ãõç]' OR title ILIKE 'Introdução%' OR title ILIKE 'Mirante%' OR title ILIKE 'Área de decolagem%');

  -- Italian: known IT words
  UPDATE public.guide_sections
  SET language_code = 'it', language = 'Italian'
  WHERE guide_id = v_guide_id
    AND is_original = false
    AND language_code = 'en'
    AND (title ILIKE 'Introduzione%' OR title ILIKE 'Area di%' OR title ILIKE 'Punto panoramico%' OR title ILIKE '%mongolfiere%');

  -- German: ü/ö/ä/ß or known DE words
  UPDATE public.guide_sections
  SET language_code = 'de', language = 'German'
  WHERE guide_id = v_guide_id
    AND is_original = false
    AND language_code = 'en'
    AND (title ~ '[üöäßÜÖÄ]' OR title ILIKE 'Einführung%' OR title ILIKE 'Startfeld%' OR title ILIKE '%Panorama%');

  -- French: remaining English-tagged translations (incl. those with no special chars like "Introduction", "Site de décollage")
  UPDATE public.guide_sections
  SET language_code = 'fr', language = 'French'
  WHERE guide_id = v_guide_id
    AND is_original = false
    AND language_code = 'en';

  -- Update the audio_guides.languages array with the actual languages now present
  UPDATE public.audio_guides
  SET languages = ARRAY(
    SELECT DISTINCT language
    FROM public.guide_sections
    WHERE guide_id = v_guide_id
    ORDER BY language
  )
  WHERE id = v_guide_id;
END $$;