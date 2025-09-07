-- Insert demo creator profiles with diverse creator types and verification status
INSERT INTO public.profiles (
  user_id, email, full_name, bio, avatar_url, role, verification_status, 
  verified_at, creator_badge, creator_type, specialties, languages_spoken, 
  guide_country, experience_years, current_tier, tier_points, social_profiles
) VALUES 
  -- Influencer Creator
  (
    gen_random_uuid(), 
    'sophia.travel@demo.com', 
    'Sophia Chen', 
    'Travel influencer with 500K+ followers sharing authentic cultural experiences across Asia. Known for viral food tours and hidden gem discoveries.',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    'content_creator'::user_role,
    'verified',
    now() - interval '30 days',
    true,
    'influencer',
    ARRAY['Food Tours', 'Cultural Experiences', 'Photography', 'Social Media'],
    ARRAY['English', 'Mandarin', 'Japanese'],
    'Japan',
    5,
    'gold',
    850,
    '{"instagram": "@sophiatravels", "tiktok": "@sophiaexplores", "youtube": "SophiaTravelAdventures"}'::jsonb
  ),
  -- Local Guide Creator  
  (
    gen_random_uuid(),
    'marco.venetian@demo.com',
    'Marco Venetian',
    'Born and raised Venetian local guide with 15+ years experience. Official licensed guide specializing in authentic Venice beyond the tourist crowds.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'content_creator'::user_role,
    'verified',
    now() - interval '45 days',
    true,
    'local_guide',
    ARRAY['Local History', 'Architecture', 'Authentic Experiences', 'Hidden Gems'],
    ARRAY['English', 'Italian', 'French', 'German'],
    'Italy',
    15,
    'platinum',
    1200,
    '{"website": "venetianwalks.com", "linkedin": "marco-venetian-guide"}'::jsonb
  ),
  -- Expert Creator
  (
    gen_random_uuid(),
    'dr.maya.artifacts@demo.com', 
    'Dr. Maya Patel',
    'Art historian and museum curator with PhD from Oxford. Specializes in ancient civilizations and artifact storytelling with 20+ years of academic experience.',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400',
    'content_creator'::user_role,
    'verified',
    now() - interval '60 days',
    true,
    'expert',
    ARRAY['Art History', 'Museums', 'Ancient Civilizations', 'Academic Tours'],
    ARRAY['English', 'Hindi', 'Sanskrit'],
    'United Kingdom',
    20,
    'platinum',
    1350,
    '{"academia": "oxford.edu/maya-patel", "researchgate": "maya-patel-art-history"}'::jsonb
  ),
  -- Another Influencer
  (
    gen_random_uuid(),
    'alex.adventure@demo.com',
    'Alex Rivera',
    'Adventure travel content creator known for extreme sports and off-the-beaten-path destinations. Creates viral content about adrenaline experiences worldwide.',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    'content_creator'::user_role,
    'verified',
    now() - interval '20 days',
    true,
    'influencer',
    ARRAY['Adventure Sports', 'Extreme Tourism', 'Outdoor Activities', 'Travel Vlogs'],
    ARRAY['English', 'Spanish', 'Portuguese'],
    'Brazil',
    8,
    'gold',
    920,
    '{"youtube": "AlexAdventureTime", "instagram": "@alexextreme", "tiktok": "@adventurealex"}'::jsonb
  ),
  -- Local Guide from Greece
  (
    gen_random_uuid(),
    'elena.greek@demo.com',
    'Elena Kouris',
    'Third-generation local guide from Santorini. Family business specializing in Greek mythology, wine tours, and sunset experiences with authentic island hospitality.',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    'content_creator'::user_role,
    'verified',
    now() - interval '90 days',
    true,
    'local_guide',
    ARRAY['Greek Mythology', 'Wine Tours', 'Sunset Tours', 'Island Culture'],
    ARRAY['English', 'Greek', 'French'],
    'Greece',
    12,
    'gold',
    780,
    '{"website": "santoriniauthentic.gr", "facebook": "elena-santorini-tours"}'::jsonb
  ),
  -- Expert Creator - Archaeology
  (
    gen_random_uuid(),
    'prof.james.ruins@demo.com',
    'Prof. James Mitchell',
    'Archaeological expert and professor specializing in Roman and Mayan civilizations. Led excavations at Pompeii and Chichen Itza. Makes ancient history accessible to all.',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400',
    'content_creator'::user_role,
    'verified',
    now() - interval '75 days',
    true,
    'expert',
    ARRAY['Archaeology', 'Roman History', 'Mayan Civilization', 'Historical Sites'],
    ARRAY['English', 'Latin', 'Spanish'],
    'United States',
    25,
    'platinum',
    1450,
    '{"university": "stanford.edu/james-mitchell", "publications": "archaeological-journal.com/j-mitchell"}'::jsonb
  ),
  -- Rising Influencer 
  (
    gen_random_uuid(),
    'zara.culture@demo.com',
    'Zara Al-Mahmoud',
    'Cultural bridge-builder sharing the beauty of Middle Eastern traditions and modern life. Growing social media presence focused on cultural understanding and authentic experiences.',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    'content_creator'::user_role,
    'verified',
    now() - interval '15 days',
    true,
    'influencer',
    ARRAY['Cultural Exchange', 'Middle Eastern Culture', 'Modern Traditions', 'Photography'],
    ARRAY['English', 'Arabic', 'French'],
    'Morocco',
    3,
    'silver',
    420,
    '{"instagram": "@zara_cultures", "tiktok": "@zaracultural"}'::jsonb
  ),
  -- Local Guide from Peru
  (
    gen_random_uuid(),
    'carlos.inca@demo.com',
    'Carlos Quispe',
    'Indigenous Quechua guide from Cusco with deep ancestral knowledge of Inca traditions. Offers transformative spiritual journeys through sacred valley and Machu Picchu.',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
    'content_creator'::user_role,
    'verified',
    now() - interval '120 days',
    true,
    'local_guide',
    ARRAY['Inca History', 'Spiritual Tours', 'Indigenous Culture', 'Sacred Sites'],
    ARRAY['English', 'Spanish', 'Quechua'],
    'Peru',
    18,
    'platinum',
    1100,
    '{"community": "cusco-indigenous-guides.org", "certification": "peru-tourism-board"}'::jsonb
  );

-- Update tier points for all creators to trigger tier calculation
UPDATE public.profiles 
SET tier_points = CASE 
  WHEN full_name = 'Sophia Chen' THEN 850
  WHEN full_name = 'Marco Venetian' THEN 1200  
  WHEN full_name = 'Dr. Maya Patel' THEN 1350
  WHEN full_name = 'Alex Rivera' THEN 920
  WHEN full_name = 'Elena Kouris' THEN 780
  WHEN full_name = 'Prof. James Mitchell' THEN 1450
  WHEN full_name = 'Zara Al-Mahmoud' THEN 420
  WHEN full_name = 'Carlos Quispe' THEN 1100
  ELSE tier_points
END
WHERE role = 'content_creator' AND verification_status = 'verified';