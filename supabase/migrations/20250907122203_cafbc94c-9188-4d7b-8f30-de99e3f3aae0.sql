-- Create demo data that works with existing audio guides
-- We'll ensure all creator profiles have proper data

-- Update existing audio guides ratings and reviews to have better demo data
UPDATE public.audio_guides 
SET 
  rating = CASE 
    WHEN location LIKE '%Rome%' THEN 4.8
    WHEN location LIKE '%Kyoto%' THEN 4.9
    WHEN location LIKE '%Paris%' THEN 4.7
    WHEN location LIKE '%Santorini%' THEN 4.6
    WHEN location LIKE '%Machu Picchu%' THEN 4.9
    ELSE 4.5
  END,
  total_reviews = CASE 
    WHEN location LIKE '%Rome%' THEN 124
    WHEN location LIKE '%Kyoto%' THEN 89
    WHEN location LIKE '%Paris%' THEN 156
    WHEN location LIKE '%Santorini%' THEN 67
    WHEN location LIKE '%Machu Picchu%' THEN 203
    ELSE 45
  END,
  total_purchases = CASE 
    WHEN location LIKE '%Rome%' THEN 342
    WHEN location LIKE '%Kyoto%' THEN 278
    WHEN location LIKE '%Paris%' THEN 401
    WHEN location LIKE '%Santorini%' THEN 189
    WHEN location LIKE '%Machu Picchu%' THEN 567
    ELSE 123
  END,
  is_approved = true,
  is_published = true
WHERE creator_id IS NOT NULL;

-- Create a demo notification about the enhanced platform
INSERT INTO public.creator_updates (
  creator_id,
  title,
  content,
  update_type,
  created_at
)
SELECT 
  DISTINCT creator_id,
  'Welcome to Enhanced Audio Guides Platform!',
  'We''ve upgraded our platform with new creator tools, analytics, and user engagement features. Check out your new dashboard!',
  'announcement',
  now() - interval '1 hour'
FROM public.audio_guides
WHERE creator_id IS NOT NULL
LIMIT 1;