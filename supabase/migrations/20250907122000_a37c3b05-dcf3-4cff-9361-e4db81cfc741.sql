-- Create demo data without trying to insert into auth.users
-- We'll create profiles that can work with the existing system

-- First, let's see what existing guides we have and update them with realistic demo creator data
-- We'll use the existing user_id structure but create comprehensive profiles

-- Delete any existing broken profile data first
DELETE FROM public.profiles WHERE email LIKE '%@guides.%' OR email LIKE '%@traveler.%' OR email = 'admin@audioguides.app';

-- Create sample creator profiles using existing guide creator_ids if they exist
-- If no creator_id exists, we'll create new ones

-- Get the creator IDs from existing guides and create profiles for them
DO $$
DECLARE
  guide_record RECORD;
  creator_count INTEGER := 0;
BEGIN
  -- Create profiles for existing audio guide creators
  FOR guide_record IN 
    SELECT DISTINCT creator_id, location 
    FROM public.audio_guides 
    WHERE creator_id IS NOT NULL
    LIMIT 5
  LOOP
    creator_count := creator_count + 1;
    
    -- Insert profile based on location
    IF guide_record.location LIKE '%Rome%' OR guide_record.location LIKE '%Italy%' THEN
      INSERT INTO public.profiles (
        user_id, email, full_name, role, verification_status, verified_at, creator_badge,
        bio, specialties, languages_spoken, experience_years, guide_country, 
        license_type, license_country, current_tier, tier_points, social_profiles
      ) VALUES (
        guide_record.creator_id,
        'marco.rossi.' || creator_count || '@guides.it',
        'Marco Rossi',
        'content_creator', 'verified', now() - interval '4 months', true,
        'Licensed tour guide specializing in Roman history and Italian Renaissance art. 15+ years of experience.',
        ARRAY['Ancient History', 'Renaissance Art', 'Roman Architecture'],
        ARRAY['Italian', 'English', 'Spanish'],
        15, 'Italy', 'Licensed Tour Guide', 'Italy', 'gold', 850,
        '{"website": "https://romeguides.com/marco", "instagram": "@marcoromeguide"}'
      ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        verification_status = EXCLUDED.verification_status,
        bio = EXCLUDED.bio;
        
    ELSIF guide_record.location LIKE '%Kyoto%' OR guide_record.location LIKE '%Japan%' THEN
      INSERT INTO public.profiles (
        user_id, email, full_name, role, verification_status, verified_at, creator_badge,
        bio, specialties, languages_spoken, experience_years, guide_country, 
        license_type, license_country, current_tier, tier_points, social_profiles
      ) VALUES (
        guide_record.creator_id,
        'yuki.tanaka.' || creator_count || '@japanguides.jp',
        'Yuki Tanaka',
        'content_creator', 'verified', now() - interval '3 months', true,
        'Cultural historian specializing in traditional Japanese temples and gardens.',
        ARRAY['Buddhist Temples', 'Japanese Gardens', 'Tea Ceremony'],
        ARRAY['Japanese', 'English', 'Mandarin'],
        8, 'Japan', 'Cultural Heritage Guide', 'Japan', 'silver', 420,
        '{"website": "https://kyotoguides.com/yuki", "instagram": "@yukitemples"}'
      ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        verification_status = EXCLUDED.verification_status,
        bio = EXCLUDED.bio;
        
    ELSIF guide_record.location LIKE '%Santorini%' OR guide_record.location LIKE '%Greece%' THEN
      INSERT INTO public.profiles (
        user_id, email, full_name, role, verification_status, verified_at, creator_badge,
        bio, specialties, languages_spoken, experience_years, guide_country, 
        license_type, license_country, current_tier, tier_points, social_profiles
      ) VALUES (
        guide_record.creator_id,
        'elena.papadopoulos.' || creator_count || '@greekguides.gr',
        'Elena Papadopoulos',
        'content_creator', 'verified', now() - interval '2 months', true,
        'Marine archaeologist with deep knowledge of Greek mythology and ancient ruins.',
        ARRAY['Greek Mythology', 'Ancient Ruins', 'Island Culture'],
        ARRAY['Greek', 'English', 'German'],
        12, 'Greece', 'Archaeological Guide', 'Greece', 'gold', 720,
        '{"website": "https://greekislandguides.com/elena"}'
      ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        verification_status = EXCLUDED.verification_status,
        bio = EXCLUDED.bio;
        
    ELSIF guide_record.location LIKE '%Machu Picchu%' OR guide_record.location LIKE '%Peru%' THEN
      INSERT INTO public.profiles (
        user_id, email, full_name, role, verification_status, verified_at, creator_badge,
        bio, specialties, languages_spoken, experience_years, guide_country, 
        license_type, license_country, current_tier, tier_points, social_profiles
      ) VALUES (
        guide_record.creator_id,
        'carlos.mendoza.' || creator_count || '@peruguides.pe',
        'Carlos Mendoza',
        'content_creator', 'verified', now() - interval '5 months', true,
        'Indigenous heritage specialist with ancestral knowledge of Inca civilization.',
        ARRAY['Inca History', 'Andean Culture', 'Mountain Trekking'],
        ARRAY['Spanish', 'English', 'Quechua'],
        20, 'Peru', 'Mountain & Heritage Guide', 'Peru', 'platinum', 1200,
        '{"website": "https://machupicchugides.com/carlos", "instagram": "@carlosmountainguide"}'
      ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        verification_status = EXCLUDED.verification_status,
        bio = EXCLUDED.bio;
        
    ELSIF guide_record.location LIKE '%Paris%' OR guide_record.location LIKE '%France%' THEN
      INSERT INTO public.profiles (
        user_id, email, full_name, role, verification_status, verified_at, creator_badge,
        bio, specialties, languages_spoken, experience_years, guide_country, 
        license_type, license_country, current_tier, tier_points, social_profiles
      ) VALUES (
        guide_record.creator_id,
        'marie.dubois.' || creator_count || '@parisguides.fr',
        'Marie Dubois',
        'content_creator', 'verified', now() - interval '1 month', true,
        'Art historian and museum curator specializing in French impressionism.',
        ARRAY['French Art', 'Impressionism', 'Museum Curation'],
        ARRAY['French', 'English', 'Italian'],
        18, 'France', 'Museum & Art Guide', 'France', 'gold', 950,
        '{"website": "https://parisartguides.com/marie", "instagram": "@marieartparis"}'
      ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        verification_status = EXCLUDED.verification_status,
        bio = EXCLUDED.bio;
    ELSE
      -- Default creator profile
      INSERT INTO public.profiles (
        user_id, email, full_name, role, verification_status, verified_at, creator_badge,
        bio, specialties, languages_spoken, experience_years, current_tier, tier_points
      ) VALUES (
        guide_record.creator_id,
        'creator' || creator_count || '@audioguides.app',
        'Expert Guide ' || creator_count,
        'content_creator', 'verified', now() - interval '1 month', true,
        'Experienced local guide with deep knowledge of the area.',
        ARRAY['Local History', 'Cultural Tours'],
        ARRAY['English'],
        10, 'bronze', 300
      ) ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        verification_status = EXCLUDED.verification_status,
        bio = EXCLUDED.bio;
    END IF;
  END LOOP;
END $$;

-- Add some demo reviews for the guides
INSERT INTO public.guide_reviews (guide_id, user_id, rating, comment, created_at)
SELECT 
  ag.id,
  ag.creator_id, -- Using creator as reviewer for demo purposes
  CASE 
    WHEN random() > 0.8 THEN 5
    WHEN random() > 0.6 THEN 4
    ELSE 3
  END,
  CASE 
    WHEN ag.location LIKE '%Rome%' THEN 'Amazing historical insights and engaging storytelling!'
    WHEN ag.location LIKE '%Kyoto%' THEN 'Peaceful and enlightening temple experience.'
    WHEN ag.location LIKE '%Paris%' THEN 'Incredible art knowledge and beautiful narration.'
    WHEN ag.location LIKE '%Greece%' THEN 'Fascinating mythology and stunning island views.'
    WHEN ag.location LIKE '%Machu Picchu%' THEN 'Deep cultural heritage and breathtaking mountain wisdom.'
    ELSE 'Great guide with excellent local knowledge!'
  END,
  now() - interval '1 week'
FROM public.audio_guides ag
WHERE ag.creator_id IS NOT NULL
LIMIT 10;

-- Create some creator updates
INSERT INTO public.creator_updates (creator_id, title, content, update_type, created_at)
SELECT 
  ag.creator_id,
  'New Guide Available: ' || ag.title,
  'Just completed this amazing audio guide experience. Can''t wait for you to explore ' || ag.location || '!',
  'announcement',
  now() - interval '2 days'
FROM public.audio_guides ag
WHERE ag.creator_id IS NOT NULL
LIMIT 5;

-- Add some live experiences
INSERT INTO public.live_experiences (
  creator_id, title, description, experience_type, duration_minutes, 
  price_usd, max_participants, category, location, language, difficulty_level
)
SELECT 
  ag.creator_id,
  'Live Virtual Tour: ' || ag.location,
  'Join me for an interactive virtual tour of ' || ag.location || ' with live Q&A and storytelling.',
  'virtual_tour',
  90,
  2999,
  12,
  ag.category,
  ag.location || ' (Virtual)',
  'English',
  'beginner'
FROM public.audio_guides ag
WHERE ag.creator_id IS NOT NULL
LIMIT 3;