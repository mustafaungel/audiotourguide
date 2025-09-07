-- Create comprehensive demo data for testing all user roles and features

-- First, let's create demo profiles for different user types
-- We'll use realistic UUIDs for demo users

-- Demo Admin User
INSERT INTO public.profiles (
  id, 
  user_id, 
  email, 
  full_name, 
  role, 
  verification_status, 
  bio,
  avatar_url,
  created_at
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'admin@audioguides.app',
  'Sarah Johnson',
  'admin',
  'verified',
  'Platform administrator overseeing content quality and creator verification.',
  'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
  now() - interval '6 months'
);

-- Demo Content Creators
INSERT INTO public.profiles (
  id,
  user_id,
  email,
  full_name,
  role,
  verification_status,
  verified_at,
  creator_badge,
  bio,
  avatar_url,
  specialties,
  languages_spoken,
  experience_years,
  guide_country,
  license_type,
  license_country,
  current_tier,
  tier_points,
  social_profiles,
  created_at
) VALUES 
-- Marco Rossi - Italian Tour Guide
(
  'c1111111-1111-1111-1111-111111111111',
  'c1111111-1111-1111-1111-111111111111',
  'marco.rossi@guides.it',
  'Marco Rossi',
  'content_creator',
  'verified',
  now() - interval '4 months',
  true,
  'Licensed tour guide specializing in Roman history and Italian Renaissance art. 15+ years of experience guiding visitors through the eternal city.',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  ARRAY['Ancient History', 'Renaissance Art', 'Roman Architecture', 'Italian Culture'],
  ARRAY['Italian', 'English', 'Spanish', 'French'],
  15,
  'Italy',
  'Licensed Tour Guide',
  'Italy',
  'gold',
  850,
  '{"website": "https://romeguides.com/marco", "instagram": "@marcoromeguide", "linkedin": "marco-rossi-guide"}',
  now() - interval '2 years'
),
-- Yuki Tanaka - Japanese Cultural Guide
(
  'c2222222-2222-2222-2222-222222222222',
  'c2222222-2222-2222-2222-222222222222',
  'yuki.tanaka@japanguides.jp',
  'Yuki Tanaka',
  'content_creator',
  'verified',
  now() - interval '3 months',
  true,
  'Cultural historian and certified guide specializing in traditional Japanese temples, gardens, and tea ceremony experiences in Kyoto.',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  ARRAY['Buddhist Temples', 'Japanese Gardens', 'Tea Ceremony', 'Traditional Architecture'],
  ARRAY['Japanese', 'English', 'Mandarin'],
  8,
  'Japan',
  'Cultural Heritage Guide',
  'Japan',
  'silver',
  420,
  '{"website": "https://kyotoguides.com/yuki", "instagram": "@yukitemples"}',
  now() - interval '18 months'
),
-- Elena Papadopoulos - Greek Islands Specialist
(
  'c3333333-3333-3333-3333-333333333333',
  'c3333333-3333-3333-3333-333333333333',
  'elena.papadopoulos@greekguides.gr',
  'Elena Papadopoulos',
  'content_creator',
  'verified',
  now() - interval '2 months',
  true,
  'Marine archaeologist and island guide with deep knowledge of Greek mythology, ancient ruins, and Mediterranean culture.',
  'https://images.unsplash.com/photo-1485290334039-a3c69043e517?w=150&h=150&fit=crop&crop=face',
  ARRAY['Greek Mythology', 'Ancient Ruins', 'Island Culture', 'Mediterranean History'],
  ARRAY['Greek', 'English', 'German'],
  12,
  'Greece',
  'Archaeological Guide',
  'Greece',
  'gold',
  720,
  '{"website": "https://greekislandguides.com/elena"}',
  now() - interval '3 years'
),
-- Carlos Mendoza - Machu Picchu Expert
(
  'c4444444-4444-4444-4444-444444444444',
  'c4444444-4444-4444-4444-444444444444',
  'carlos.mendoza@peruguides.pe',
  'Carlos Mendoza',
  'content_creator',
  'verified',
  now() - interval '5 months',
  true,
  'Indigenous heritage specialist and mountain guide with ancestral knowledge of Inca civilization and Andean culture.',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  ARRAY['Inca History', 'Andean Culture', 'Mountain Trekking', 'Indigenous Heritage'],
  ARRAY['Spanish', 'English', 'Quechua'],
  20,
  'Peru',
  'Mountain & Heritage Guide',
  'Peru',
  'platinum',
  1200,
  '{"website": "https://machupicchugides.com/carlos", "instagram": "@carlosmountainguide"}',
  now() - interval '5 years'
),
-- Marie Dubois - Parisian Art Guide
(
  'c5555555-5555-5555-5555-555555555555',
  'c5555555-5555-5555-5555-555555555555',
  'marie.dubois@parisguides.fr',
  'Marie Dubois',
  'content_creator',
  'verified',
  now() - interval '1 month',
  true,
  'Art historian and museum curator specializing in French impressionism and Louvre masterpieces. Former Sorbonne professor.',
  'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
  ARRAY['French Art', 'Impressionism', 'Museum Curation', 'Art History'],
  ARRAY['French', 'English', 'Italian'],
  18,
  'France',
  'Museum & Art Guide',
  'France',
  'gold',
  950,
  '{"website": "https://parisartguides.com/marie", "instagram": "@marieartparis"}',
  now() - interval '4 years'
);

-- Demo Traveler Users
INSERT INTO public.profiles (
  id,
  user_id,
  email,
  full_name,
  role,
  bio,
  avatar_url,
  created_at
) VALUES 
(
  't1111111-1111-1111-1111-111111111111',
  't1111111-1111-1111-1111-111111111111',
  'alex.chen@traveler.com',
  'Alex Chen',
  'traveler',
  'Travel enthusiast exploring historical sites around the world.',
  'https://images.unsplash.com/photo-1539571696857-7a4bb0a9e7e0?w=150&h=150&fit=crop&crop=face',
  now() - interval '8 months'
),
(
  't2222222-2222-2222-2222-222222222222',
  't2222222-2222-2222-2222-222222222222',
  'emma.williams@traveler.com',
  'Emma Williams',
  'traveler',
  'Cultural explorer with passion for art museums and local experiences.',
  'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
  now() - interval '6 months'
),
(
  't3333333-3333-3333-3333-333333333333',
  't3333333-3333-3333-3333-333333333333',
  'david.brown@traveler.com',
  'David Brown',
  'traveler',
  'Adventure seeker interested in ancient civilizations and mountain expeditions.',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  now() - interval '4 months'
);

-- Update existing audio guides to link them to our demo creators
UPDATE public.audio_guides SET creator_id = 'c1111111-1111-1111-1111-111111111111' WHERE location LIKE '%Rome%' OR location LIKE '%Italy%';
UPDATE public.audio_guides SET creator_id = 'c2222222-2222-2222-2222-222222222222' WHERE location LIKE '%Kyoto%' OR location LIKE '%Japan%';
UPDATE public.audio_guides SET creator_id = 'c3333333-3333-3333-3333-333333333333' WHERE location LIKE '%Santorini%' OR location LIKE '%Greece%';
UPDATE public.audio_guides SET creator_id = 'c4444444-4444-4444-4444-444444444444' WHERE location LIKE '%Machu Picchu%' OR location LIKE '%Peru%';
UPDATE public.audio_guides SET creator_id = 'c5555555-5555-5555-5555-555555555555' WHERE location LIKE '%Paris%' OR location LIKE '%France%';

-- If there are any guides without specific location matches, assign them to Marco (our most experienced guide)
UPDATE public.audio_guides SET creator_id = 'c1111111-1111-1111-1111-111111111111' WHERE creator_id IS NULL;

-- Add demo user purchases
INSERT INTO public.user_purchases (
  user_id,
  guide_id,
  price_paid,
  currency,
  stripe_payment_id,
  access_code,
  purchase_date
) 
SELECT 
  't1111111-1111-1111-1111-111111111111' as user_id,
  ag.id as guide_id,
  ag.price_usd,
  'usd',
  'pi_demo_' || substring(ag.id::text from 1 for 8),
  public.generate_access_code(),
  now() - interval '2 weeks'
FROM public.audio_guides ag
WHERE ag.location LIKE '%Rome%'
LIMIT 2;

INSERT INTO public.user_purchases (
  user_id,
  guide_id,
  price_paid,
  currency,
  stripe_payment_id,
  access_code,
  purchase_date
) 
SELECT 
  't2222222-2222-2222-2222-222222222222' as user_id,
  ag.id as guide_id,
  ag.price_usd,
  'usd',
  'pi_demo_' || substring(ag.id::text from 1 for 8),
  public.generate_access_code(),
  now() - interval '1 week'
FROM public.audio_guides ag
WHERE ag.location LIKE '%Paris%'
LIMIT 1;

-- Add demo guide reviews
INSERT INTO public.guide_reviews (
  guide_id,
  user_id,
  rating,
  comment,
  created_at
)
SELECT 
  ag.id,
  't1111111-1111-1111-1111-111111111111',
  5,
  'Absolutely incredible experience! Marco brought Roman history to life with his passionate storytelling and deep knowledge.',
  now() - interval '1 week'
FROM public.audio_guides ag
WHERE ag.location LIKE '%Rome%'
LIMIT 1;

INSERT INTO public.guide_reviews (
  guide_id,
  user_id,
  rating,
  comment,
  created_at
)
SELECT 
  ag.id,
  't2222222-2222-2222-2222-222222222222',
  5,
  'Marie''s expertise in French art is unmatched. The Louvre tour was enlightening and beautifully narrated.',
  now() - interval '3 days'
FROM public.audio_guides ag
WHERE ag.location LIKE '%Paris%'
LIMIT 1;

INSERT INTO public.guide_reviews (
  guide_id,
  user_id,
  rating,
  comment,
  created_at
)
SELECT 
  ag.id,
  't3333333-3333-3333-3333-333333333333',
  4,
  'Great insights into Andean culture and Inca history. Carlos really knows his heritage!',
  now() - interval '5 days'
FROM public.audio_guides ag
WHERE ag.location LIKE '%Machu Picchu%'
LIMIT 1;

-- Create creator connections (followers)
INSERT INTO public.creator_connections (
  user_id,
  creator_id,
  connection_source,
  connected_at
) VALUES 
('t1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'purchase', now() - interval '2 weeks'),
('t1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'manual_follow', now() - interval '1 week'),
('t2222222-2222-2222-2222-222222222222', 'c5555555-5555-5555-5555-555555555555', 'purchase', now() - interval '1 week'),
('t2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 'recommendation', now() - interval '4 days'),
('t3333333-3333-3333-3333-333333333333', 'c4444444-4444-4444-4444-444444444444', 'manual_follow', now() - interval '1 month'),
('t3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 'recommendation', now() - interval '2 weeks');

-- Create some creator updates/posts
INSERT INTO public.creator_updates (
  creator_id,
  title,
  content,
  update_type,
  created_at
) VALUES 
(
  'c1111111-1111-1111-1111-111111111111',
  'New Hidden Gems of Rome Guide Available!',
  'Just finished recording my latest audio guide covering the secret spots of Rome that most tourists never discover. From hidden courtyards to underground basilicas!',
  'announcement',
  now() - interval '3 days'
),
(
  'c2222222-2222-2222-2222-222222222222',
  'Cherry Blossom Season Update',
  'Spring is here in Kyoto! The temples are absolutely breathtaking right now. Perfect timing for temple meditation walks.',
  'post',
  now() - interval '1 week'
),
(
  'c5555555-5555-5555-5555-555555555555',
  'Behind the Scenes: Recording at the Louvre',
  'Had special access to record in the museum early morning. The experience of having the Mona Lisa room to myself was magical!',
  'behind_scenes',
  now() - interval '5 days'
);

-- Add some live experiences
INSERT INTO public.live_experiences (
  creator_id,
  title,
  description,
  experience_type,
  duration_minutes,
  price_usd,
  max_participants,
  category,
  location,
  language,
  difficulty_level,
  requirements,
  included_items
) VALUES 
(
  'c1111111-1111-1111-1111-111111111111',
  'Virtual Rome: Underground Basilicas Tour',
  'Explore the hidden underground churches of Rome with live commentary and Q&A session.',
  'virtual_tour',
  90,
  2999,
  15,
  'Historical',
  'Rome, Italy (Virtual)',
  'English',
  'beginner',
  'Stable internet connection, headphones recommended',
  'Digital map, photo gallery access, recording of session'
),
(
  'c2222222-2222-2222-2222-222222222222',
  'Live Kyoto Temple Meditation Walk',
  'Join me for a peaceful morning walk through Kyoto temples with meditation guidance.',
  'live_walk',
  120,
  3499,
  8,
  'Cultural',
  'Kyoto, Japan (Virtual)',
  'English',
  'beginner',
  'Quiet space for meditation',
  'Meditation guide PDF, temple history booklet'
),
(
  'c5555555-5555-5555-5555-555555555555',
  'Private Louvre Masterpieces Session',
  'Intimate discussion about 10 must-see Louvre masterpieces with art history insights.',
  'private_session',
  60,
  4999,
  3,
  'Art & Culture',
  'Paris, France (Virtual)',
  'English',
  'intermediate',
  'Basic art appreciation knowledge helpful',
  'High-resolution artwork images, recommended reading list'
);

-- Update tier points for creators based on their activity
UPDATE public.profiles SET 
  tier_points = 850,
  current_tier = 'gold'
WHERE user_id = 'c1111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET 
  tier_points = 420,
  current_tier = 'silver'
WHERE user_id = 'c2222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET 
  tier_points = 720,
  current_tier = 'gold'
WHERE user_id = 'c3333333-3333-3333-3333-333333333333';

UPDATE public.profiles SET 
  tier_points = 1200,
  current_tier = 'platinum'
WHERE user_id = 'c4444444-4444-4444-4444-444444444444';

UPDATE public.profiles SET 
  tier_points = 950,
  current_tier = 'gold'
WHERE user_id = 'c5555555-5555-5555-5555-555555555555';