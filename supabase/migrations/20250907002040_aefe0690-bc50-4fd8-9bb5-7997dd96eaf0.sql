-- First create a sample content creator profile if none exists
INSERT INTO public.profiles (user_id, email, full_name, role, verification_status, creator_badge, verified_at)
SELECT 
  gen_random_uuid(),
  'creator@audioguides.com',
  'Master Guide Creator',
  'content_creator'::user_role,
  'verified',
  true,
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE role = 'content_creator'
);

-- Insert sample audio guides with realistic data
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
  audio_url,
  preview_url,
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
  (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1),
  true,
  true,
  ARRAY['English', 'French'],
  'Morning (9-11 AM) for best lighting',
  '/src/assets/paris-louvre.jpg',
  'https://example.com/audio/montmartre.mp3',
  'https://example.com/preview/montmartre.mp3',
  'Welcome to Montmartre, where artists like Picasso and Renoir once painted...'
),
(
  'Ancient Rome: Colosseum Secrets',
  'Uncover the brutal history and architectural marvels of Romes most iconic amphitheater.',
  'Rome, Italy',
  'historical',
  'moderate',
  60,
  1599,
  (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1),
  true,
  true,
  ARRAY['English', 'Italian'],
  'Early morning (8-10 AM) to avoid crowds',
  '/src/assets/guide-colosseum.jpg',
  'https://example.com/audio/colosseum.mp3',
  'https://example.com/preview/colosseum.mp3',
  'Step into the arena where gladiators fought for their lives...'
),
(
  'Zen Gardens of Kyoto',
  'Find inner peace while exploring the most serene temples and gardens in Japans ancient capital.',
  'Kyoto, Japan',
  'cultural',
  'easy',
  90,
  1799,
  (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1),
  true,
  true,
  ARRAY['English', 'Japanese'],
  'Early morning or late afternoon',
  '/src/assets/kyoto-temple.jpg',
  'https://example.com/audio/kyoto-zen.mp3',
  'https://example.com/preview/kyoto-zen.mp3',
  'Welcome to the spiritual heart of Japan, where tradition meets tranquility...'
),
(
  'Santorini Sunset Magic',
  'Experience the worlds most famous sunset while learning about volcanic history and Greek mythology.',
  'Santorini, Greece',
  'scenic',
  'easy',
  30,
  999,
  (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1),
  true,
  true,
  ARRAY['English', 'Greek'],
  'Late afternoon (4-6 PM)',
  '/src/assets/santorini-greece.jpg',
  'https://example.com/audio/santorini.mp3',
  'https://example.com/preview/santorini.mp3',
  'As the sun begins its descent over the Aegean Sea...'
),
(
  'Machu Picchu: Lost City Revealed',
  'Journey through the clouds to uncover the mysteries of the Inca civilization.',
  'Cusco, Peru',
  'adventure',
  'challenging',
  120,
  2499,
  (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1),
  true,
  true,
  ARRAY['English', 'Spanish'],
  'Early morning (sunrise)',
  '/src/assets/machu-picchu.jpg',
  'https://example.com/audio/machu-picchu.mp3',
  'https://example.com/preview/machu-picchu.mp3',
  'High in the Andes Mountains, shrouded in mystery and mist...'
),
(
  'Cappadocia Hot Air Balloon Adventure',
  'Soar above the fairy chimneys and cave cities of Turkeys most magical landscape.',
  'Cappadocia, Turkey',
  'adventure',
  'moderate',
  180,
  3999,
  (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1),
  true,
  true,
  ARRAY['English', 'Turkish'],
  'Dawn (5-8 AM)',
  '/src/assets/cappadocia-goreme.jpg',
  'https://example.com/audio/cappadocia.mp3',
  'https://example.com/preview/cappadocia.mp3',
  'As we lift off into the dawn sky, the landscape below transforms...'
),
(
  'Istanbul: East Meets West',
  'Navigate the crossroads of Europe and Asia through bustling bazaars and ancient monuments.',
  'Istanbul, Turkey',
  'cultural',
  'moderate',
  75,
  1399,
  (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1),
  true,
  true,
  ARRAY['English', 'Turkish'],
  'Morning or evening',
  '/src/assets/istanbul-hagia-sophia.jpg',
  'https://example.com/audio/istanbul.mp3',
  'https://example.com/preview/istanbul.mp3',
  'Welcome to the city that bridges two continents...'
);

-- Insert sample viral metrics and trending data
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

-- Insert trending locations
INSERT INTO public.trending_locations (name, country, guides_count, total_views, growth_percentage, trending_rank)
VALUES
('Paris', 'France', 15, 25000, 23.5, 1),
('Rome', 'Italy', 12, 18000, 18.2, 2),
('Kyoto', 'Japan', 8, 15000, 31.8, 3),
('Santorini', 'Greece', 6, 12000, 45.1, 4),
('Cusco', 'Peru', 4, 8000, 52.3, 5),
('Cappadocia', 'Turkey', 3, 6000, 67.2, 6),
('Istanbul', 'Turkey', 7, 9000, 28.7, 7);