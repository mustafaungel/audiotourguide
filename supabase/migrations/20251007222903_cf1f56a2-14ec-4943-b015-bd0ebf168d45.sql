-- Fix language metadata: use language CODE instead of NAME
UPDATE audio_guides
SET 
  languages = ARRAY['zh']::text[],
  updated_at = now()
WHERE id = '2bf92a29-8cd4-4fe5-8713-7c58f318c831';