-- Insert sample audio guides with realistic data
INSERT INTO public.audio_guides (
  id,
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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
  gen_random_uuid(),
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

-- Insert sample viral shares
INSERT INTO public.viral_shares (guide_id, user_id, platform, location)
SELECT 
  ag.id,
  p.user_id,
  (ARRAY['facebook', 'twitter', 'instagram', 'tiktok', 'whatsapp'])[FLOOR(RANDOM() * 5) + 1],
  ag.location
FROM public.audio_guides ag
CROSS JOIN public.profiles p
WHERE ag.is_published = true AND p.role != 'admin'
ORDER BY RANDOM()
LIMIT 50;

-- Insert sample user achievements
INSERT INTO public.user_achievements (user_id, achievement_name, achievement_type, description, points, metadata)
SELECT 
  p.user_id,
  (ARRAY['First Share', 'Explorer', 'Culture Lover', 'Adventure Seeker', 'Social Butterfly'])[FLOOR(RANDOM() * 5) + 1],
  (ARRAY['social', 'exploration', 'milestone', 'engagement'])[FLOOR(RANDOM() * 4) + 1],
  'Congratulations on this achievement!',
  FLOOR(RANDOM() * 500) + 100,
  '{"earned_date": "2024-01-15", "category": "viral"}'::jsonb
FROM public.profiles p
WHERE p.role != 'admin'
ORDER BY RANDOM()
LIMIT 20;

-- Insert sample creator earnings
INSERT INTO public.creator_earnings (creator_id, guide_id, earning_type, amount, currency)
SELECT 
  ag.creator_id,
  ag.id,
  'guide_purchase',
  (ag.price_usd * 0.7)::numeric / 100,
  'USD'
FROM public.audio_guides ag
WHERE ag.is_published = true
ORDER BY RANDOM()
LIMIT 15;