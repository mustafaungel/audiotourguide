UPDATE public.guide_sections SET language_code='pt', language='Portuguese'
WHERE id = '1fa3432c-699c-4551-8081-5cf3fd39e961';

UPDATE public.guide_sections SET language_code='es', language='Spanish'
WHERE id = 'e19d3681-af29-4267-a14d-e0739ce56f3c';

-- '7ff0abae...' (title "Introduction") stays as French (it's the FR intro)

UPDATE public.audio_guides
SET languages = ARRAY(
  SELECT DISTINCT language FROM public.guide_sections
  WHERE guide_id = 'd57edafb-39ab-4d95-a929-008de3c347ed' ORDER BY language
)
WHERE id = 'd57edafb-39ab-4d95-a929-008de3c347ed';