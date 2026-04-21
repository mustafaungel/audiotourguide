
-- Fix missing duration_seconds for ES, JA, PT sections
UPDATE public.guide_sections SET duration_seconds = 97 WHERE id = 'e19d3681-af29-4267-a14d-e0739ce56f3c';
UPDATE public.guide_sections SET duration_seconds = 168 WHERE id = 'a7afe89f-3732-4ce9-9f14-0c584fd514e5';
UPDATE public.guide_sections SET duration_seconds = 149 WHERE id = '10464e7e-1588-4607-9fcd-bb7fa29cdc10';
UPDATE public.guide_sections SET duration_seconds = 180 WHERE id = '9b85c55f-b2db-4909-9c17-1fafb2fae92c';
UPDATE public.guide_sections SET duration_seconds = 107 WHERE id = 'c1f20ee2-d2af-4f06-b4c8-125a592813be';
UPDATE public.guide_sections SET duration_seconds = 165 WHERE id = 'd1402144-f11d-4174-bde6-e9400b00d196';
UPDATE public.guide_sections SET duration_seconds = 154 WHERE id = '0bd0b373-7967-4e0f-bed3-bf1c4985b929';
UPDATE public.guide_sections SET duration_seconds = 71  WHERE id = '1fa3432c-699c-4551-8081-5cf3fd39e961';
UPDATE public.guide_sections SET duration_seconds = 127 WHERE id = '00ab8c41-53cb-4f2b-b7dd-fb8c9b275459';
UPDATE public.guide_sections SET duration_seconds = 114 WHERE id = 'ad7d8250-f503-4c48-a092-5a08215f94e4';
UPDATE public.guide_sections SET duration_seconds = 134 WHERE id = '573c8093-374f-4e0d-8089-86f0478abacc';

-- Fix Japanese "Love Valley" wrong order_index (39 -> 3) and translate title
UPDATE public.guide_sections 
SET order_index = 3, title = 'ラブバレー (バーリデレ)'
WHERE id = 'd83ef45d-3419-49f5-a47b-8aaf92325761';

-- Translate remaining English-titled Japanese sections (keep Japanese annotation, drop English)
UPDATE public.guide_sections 
SET title = '熱気球離陸エリア'
WHERE id = 'd1402144-f11d-4174-bde6-e9400b00d196';

UPDATE public.guide_sections 
SET title = 'ギョレメ・パノラマ展望台'
WHERE id = '0bd0b373-7967-4e0f-bed3-bf1c4985b929';
