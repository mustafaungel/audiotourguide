-- Remove the trigger that's causing issues
DROP TRIGGER IF EXISTS update_trending_locations_updated_at ON public.trending_locations;

-- Insert sample audio guides (with constraint already removed)
INSERT INTO public.audio_guides (
  title,
  description,
  location,
  category,
  difficulty,
  duration,
  price_usd,
  creator_id,
  is_published,
  is_approved,
  languages,
  best_time,
  image_url,
  transcript
) VALUES
(
  'Hidden Gems of Montmartre',
  'Discover the secret corners and artistic treasures of Paris most bohemian neighborhood, away from the tourist crowds.',
  'Paris, France',
  'cultural',
  'easy',
  45,
  1299,
  gen_random_uuid(),
  true,
  true,
  ARRAY['English', 'French'],
  'Morning (9-11 AM) for best lighting',
  '/src/assets/paris-louvre.jpg',
  'Welcome to Montmartre, where artists like Picasso and Renoir once painted in the winding cobblestone streets.'
),
(
  'Ancient Rome: Colosseum Secrets',
  'Uncover the brutal history and architectural marvels of Rome''s most iconic amphitheater.',
  'Rome, Italy',
  'historical',
  'moderate',
  60,
  1599,
  gen_random_uuid(),
  true,
  true,
  ARRAY['English', 'Italian'],
  'Early morning (8-10 AM) to avoid crowds',
  '/src/assets/guide-colosseum.jpg',
  'Step into the arena where gladiators fought for their lives and emperors decided the fate of warriors.'
),
(
  'Zen Gardens of Kyoto',
  'Find inner peace while exploring the most serene temples and gardens in Japan''s ancient capital.',
  'Kyoto, Japan',
  'cultural',
  'easy',
  90,
  1799,
  gen_random_uuid(),
  true,
  true,
  ARRAY['English', 'Japanese'],
  'Early morning or late afternoon',
  '/src/assets/kyoto-temple.jpg',
  'Welcome to the spiritual heart of Japan, where tradition meets tranquility.'
),
(
  'Santorini Sunset Magic',
  'Experience the world''s most famous sunset while learning about volcanic history and Greek mythology.',
  'Santorini, Greece',
  'scenic',
  'easy',
  30,
  999,
  gen_random_uuid(),
  true,
  true,
  ARRAY['English', 'Greek'],
  'Late afternoon (4-6 PM)',
  '/src/assets/santorini-greece.jpg',
  'As the sun begins its descent over the Aegean Sea, witness the volcanic cliffs of Santorini.'
),
(
  'Machu Picchu: Lost City Revealed',
  'Journey through the clouds to uncover the mysteries of the Inca civilization.',
  'Cusco, Peru',
  'adventure',
  'challenging',
  120,
  2499,
  gen_random_uuid(),
  true,
  true,
  ARRAY['English', 'Spanish'],
  'Early morning (sunrise)',
  '/src/assets/machu-picchu.jpg',
  'High in the Andes Mountains, shrouded in mystery and mist, lies the most spectacular site in South America.'
),
(
  'Cappadocia Hot Air Balloon Adventure',
  'Soar above the fairy chimneys and cave cities of Turkey''s most magical landscape.',
  'Cappadocia, Turkey',
  'adventure',
  'moderate',
  180,
  3999,
  gen_random_uuid(),
  true,
  true,
  ARRAY['English', 'Turkish'],
  'Dawn (5-8 AM)',
  '/src/assets/cappadocia-goreme.jpg',
  'As we lift off into the dawn sky, the landscape below transforms into a fairy tale.'
),
(
  'Istanbul: East Meets West',
  'Navigate the crossroads of Europe and Asia through bustling bazaars and ancient monuments.',
  'Istanbul, Turkey',
  'cultural',
  'moderate',
  75,
  1399,
  gen_random_uuid(),
  true,
  true,
  ARRAY['English', 'Turkish'],
  'Morning or evening',
  '/src/assets/istanbul-hagia-sophia.jpg',
  'Welcome to the city that bridges two continents.'
);

-- Update trending locations safely
UPDATE public.trending_locations SET
  guides_count = 15,
  total_views = 25000,
  growth_percentage = 23.5,
  trending_rank = 1
WHERE name = 'Paris' AND country = 'France';

-- Insert sample viral metrics for each guide
INSERT INTO public.viral_metrics (guide_id, date, views_count, shares_count, downloads_count, viral_score, trending_rank, completion_rate)
SELECT 
  ag.id,
  CURRENT_DATE - (FLOOR(RANDOM() * 30)::int),
  FLOOR(RANDOM() * 5000) + 100,
  FLOOR(RANDOM() * 500) + 10,
  FLOOR(RANDOM() * 200) + 5,
  FLOOR(RANDOM() * 40) + 60,
  FLOOR(RANDOM() * 10) + 1,
  0.7 + (RANDOM() * 0.3)
FROM public.audio_guides ag
WHERE ag.is_published = true;