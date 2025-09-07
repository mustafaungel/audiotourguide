-- Insert demo creator profiles
INSERT INTO public.profiles (
  user_id, email, full_name, bio, role, verification_status, verified_at, creator_badge,
  specialties, experience_years, guide_country, languages_spoken, 
  avatar_url, current_tier, tier_points
) VALUES
-- Art History Expert
(gen_random_uuid(), 'elena.rossi@example.com', 'Elena Rossi', 
 'Passionate art historian with 15 years of experience guiding visitors through Europe''s greatest museums and galleries. Specialized in Renaissance and Baroque art with published research on Italian masters.',
 'content_creator', 'verified', now() - interval '2 months', true,
 '{"Art History", "Museums", "Renaissance", "Italian Culture"}', 15, 'Italy',
 '{"English", "Italian", "French"}', 
 'https://images.unsplash.com/photo-1494790108755-2616c819e3f5?w=400&h=400&fit=crop&crop=face',
 'gold', 850),

-- Local Cultural Guide
(gen_random_uuid(), 'kenji.tanaka@example.com', 'Kenji Tanaka',
 'Born and raised in Kyoto, I''ve been sharing the secrets of traditional Japanese culture for over a decade. From ancient temples to modern street food, I know every hidden gem.',
 'content_creator', 'verified', now() - interval '1 month', true,
 '{"Japanese Culture", "Temples", "Food Tours", "Traditional Arts"}', 12, 'Japan',
 '{"Japanese", "English", "Mandarin"}',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
 'platinum', 1200),

-- Archaeological Expert  
(gen_random_uuid(), 'maria.garcia@example.com', 'Dr. Maria Garcia',
 'Archaeological researcher turned tour guide. I''ve excavated sites across Peru and now share the fascinating stories of ancient civilizations with travelers from around the world.',
 'content_creator', 'verified', now() - interval '3 weeks', true,
 '{"Archaeology", "Ancient History", "Inca Culture", "Hiking"}', 18, 'Peru',
 '{"Spanish", "English", "Quechua"}',
 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
 'platinum', 1450),

-- Architecture Specialist
(gen_random_uuid(), 'pierre.dubois@example.com', 'Pierre Dubois',
 'Licensed architect and passionate storyteller. I reveal the secrets behind Paris''s most iconic buildings, from Gothic cathedrals to modern marvels.',
 'content_creator', 'verified', now() - interval '1 week', true,
 '{"Architecture", "French History", "Gothic Art", "Urban Planning"}', 10, 'France',
 '{"French", "English", "German"}',
 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
 'gold', 920),

-- Nature & Wildlife Expert
(gen_random_uuid(), 'sofia.andersson@example.com', 'Sofia Andersson',
 'Marine biologist and nature photographer. I guide eco-tours in the stunning Greek islands, combining conservation education with breathtaking natural beauty.',
 'content_creator', 'verified', now() - interval '2 weeks', true,
 '{"Marine Biology", "Photography", "Island Ecology", "Conservation"}', 8, 'Greece',
 '{"Swedish", "English", "Greek"}',
 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
 'silver', 650),

-- Urban Culture Guide
(gen_random_uuid(), 'ahmed.hassan@example.com', 'Ahmed Hassan',
 'Street art enthusiast and cultural anthropologist. I show visitors the vibrant underground culture of Istanbul, from ancient bazaars to contemporary art scenes.',
 'content_creator', 'verified', now() - interval '5 days', true,
 '{"Street Art", "Ottoman History", "Contemporary Culture", "Markets"}', 7, 'Turkey',
 '{"Turkish", "English", "Arabic"}',
 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
 'silver', 580),

-- Culinary Expert
(gen_random_uuid(), 'giulia.ferrari@example.com', 'Giulia Ferrari',
 'Third-generation chef and food historian. I take you on culinary journeys through Rome''s neighborhoods, sharing recipes and stories passed down through generations.',
 'content_creator', 'verified', now() - interval '3 days', true,
 '{"Culinary History", "Traditional Cooking", "Food Markets", "Wine"}', 11, 'Italy',
 '{"Italian", "English", "Spanish"}',
 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
 'gold', 780),

-- Adventure Guide
(gen_random_uuid(), 'erik.johansson@example.com', 'Erik Johansson',
 'Mountain guide and adventure photographer. I lead expeditions through Cappadocia''s otherworldly landscapes, combining hiking with photography workshops.',
 'content_creator', 'verified', now() - interval '1 day', true,
 '{"Adventure Tourism", "Photography", "Geology", "Hot Air Ballooning"}', 9, 'Turkey',
 '{"Swedish", "English", "Turkish"}',
 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=400&h=400&fit=crop&crop=face',
 'gold', 820);

-- Get the inserted creator IDs for audio guides
DO $$
DECLARE
    elena_id uuid;
    kenji_id uuid;
    maria_id uuid;
    pierre_id uuid;
    sofia_id uuid;
    ahmed_id uuid;
    giulia_id uuid;
    erik_id uuid;
BEGIN
    -- Get creator IDs
    SELECT user_id INTO elena_id FROM public.profiles WHERE email = 'elena.rossi@example.com';
    SELECT user_id INTO kenji_id FROM public.profiles WHERE email = 'kenji.tanaka@example.com';
    SELECT user_id INTO maria_id FROM public.profiles WHERE email = 'maria.garcia@example.com';
    SELECT user_id INTO pierre_id FROM public.profiles WHERE email = 'pierre.dubois@example.com';
    SELECT user_id INTO sofia_id FROM public.profiles WHERE email = 'sofia.andersson@example.com';
    SELECT user_id INTO ahmed_id FROM public.profiles WHERE email = 'ahmed.hassan@example.com';
    SELECT user_id INTO giulia_id FROM public.profiles WHERE email = 'giulia.ferrari@example.com';
    SELECT user_id INTO erik_id FROM public.profiles WHERE email = 'erik.johansson@example.com';

    -- Insert audio guides for Elena (Art History)
    INSERT INTO public.audio_guides (
        creator_id, title, description, location, category, difficulty, duration, price_usd,
        is_published, is_approved, rating, total_reviews, total_purchases,
        languages, best_time, image_url
    ) VALUES
    (elena_id, 'Masterpieces of the Louvre', 'Discover the stories behind the world''s most famous artworks including the Mona Lisa, Venus de Milo, and Winged Victory.', 'Paris, France', 'Museums', 'Beginner', 120, 25, true, true, 4.8, 127, 89, '{"English", "Italian"}', 'Morning (9-11 AM)', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800'),
    (elena_id, 'Vatican Museums Deep Dive', 'An intimate journey through the Vatican''s treasures, from Michelangelo''s Sistine Chapel to the Renaissance Rooms.', 'Vatican City', 'Museums', 'Intermediate', 180, 35, true, true, 4.9, 203, 156, '{"English", "Italian"}', 'Early Morning (8-10 AM)', 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=800'),
    (elena_id, 'Renaissance Florence Walking Tour', 'Walk in the footsteps of Michelangelo and Leonardo da Vinci through the birthplace of the Renaissance.', 'Florence, Italy', 'Art History', 'Beginner', 150, 30, true, true, 4.7, 94, 67, '{"English", "Italian"}', 'Afternoon (2-4 PM)', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800');

    -- Insert audio guides for Kenji (Japanese Culture)
    INSERT INTO public.audio_guides (
        creator_id, title, description, location, category, difficulty, duration, price_usd,
        is_published, is_approved, rating, total_reviews, total_purchases,
        languages, best_time, image_url
    ) VALUES
    (kenji_id, 'Zen Temples of Kyoto', 'Experience tranquility in Kyoto''s most sacred temples while learning about Buddhist philosophy and Japanese spirituality.', 'Kyoto, Japan', 'Temples', 'Beginner', 180, 28, true, true, 4.9, 145, 112, '{"English", "Japanese"}', 'Early Morning (7-9 AM)', 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800'),
    (kenji_id, 'Hidden Gems of Gion District', 'Discover the secret world of geishas, traditional tea houses, and preserved Edo-period streets.', 'Kyoto, Japan', 'Cultural', 'Intermediate', 120, 32, true, true, 4.8, 89, 73, '{"English", "Japanese"}', 'Evening (5-7 PM)', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800'),
    (kenji_id, 'Traditional Japanese Gardens', 'Learn the art and philosophy behind Japan''s most beautiful gardens, from rock arrangements to seasonal plantings.', 'Kyoto, Japan', 'Gardens', 'Beginner', 90, 22, true, true, 4.6, 67, 45, '{"English", "Japanese"}', 'Morning (10-12 PM)', 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800');

    -- Insert audio guides for Maria (Archaeology)
    INSERT INTO public.audio_guides (
        creator_id, title, description, location, category, difficulty, duration, price_usd,
        is_published, is_approved, rating, total_reviews, total_purchases,
        languages, best_time, image_url
    ) VALUES
    (maria_id, 'Mysteries of Machu Picchu', 'Uncover the secrets of the Lost City of the Incas with insights from recent archaeological discoveries.', 'Machu Picchu, Peru', 'Archaeology', 'Intermediate', 240, 45, true, true, 4.9, 278, 201, '{"English", "Spanish"}', 'Early Morning (6-8 AM)', 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800'),
    (maria_id, 'Sacred Valley Inca Trail', 'Follow ancient Inca paths through the Sacred Valley, visiting lesser-known ruins and learning about Andean culture.', 'Sacred Valley, Peru', 'Hiking', 'Advanced', 300, 55, true, true, 4.8, 156, 89, '{"English", "Spanish"}', 'Full Day (8 AM-2 PM)', 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800');

    -- Insert audio guides for Pierre (Architecture)
    INSERT INTO public.audio_guides (
        creator_id, title, description, location, category, difficulty, duration, price_usd,
        is_published, is_approved, rating, total_reviews, total_purchases,
        languages, best_time, image_url
    ) VALUES
    (pierre_id, 'Gothic Marvels of Notre-Dame', 'Explore the architectural genius of Notre-Dame Cathedral and learn about Gothic innovation and restoration.', 'Paris, France', 'Architecture', 'Intermediate', 90, 20, true, true, 4.7, 134, 98, '{"English", "French"}', 'Afternoon (2-4 PM)', 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800'),
    (pierre_id, 'Haussmann''s Paris Revolution', 'Discover how Baron Haussmann transformed Paris into the City of Light with his revolutionary urban planning.', 'Paris, France', 'Urban Planning', 'Advanced', 150, 35, true, true, 4.6, 78, 56, '{"English", "French"}', 'Morning (10 AM-12 PM)', 'https://images.unsplash.com/photo-1431274172761-fca41d930114?w=800');

    -- Insert audio guides for Sofia (Nature)
    INSERT INTO public.audio_guides (
        creator_id, title, description, location, category, difficulty, duration, price_usd,
        is_published, is_approved, rating, total_reviews, total_purchases,
        languages, best_time, image_url
    ) VALUES
    (sofia_id, 'Santorini Marine Life Safari', 'Dive into the underwater world of the Aegean Sea and discover unique marine ecosystems around volcanic islands.', 'Santorini, Greece', 'Marine Biology', 'Intermediate', 180, 38, true, true, 4.8, 92, 67, '{"English", "Greek"}', 'Morning (9-11 AM)', 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800'),
    (sofia_id, 'Photography Sunset Tour', 'Capture the perfect sunset shots while learning professional photography techniques in one of the world''s most photogenic locations.', 'Santorini, Greece', 'Photography', 'Beginner', 120, 30, true, true, 4.9, 118, 89, '{"English", "Greek"}', 'Evening (6-8 PM)', 'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=800');

    -- Insert audio guides for Ahmed (Urban Culture)
    INSERT INTO public.audio_guides (
        creator_id, title, description, location, category, difficulty, duration, price_usd,
        is_published, is_approved, rating, total_reviews, total_purchases,
        languages, best_time, image_url
    ) VALUES
    (ahmed_id, 'Istanbul Street Art Revolution', 'Explore the vibrant street art scene in Istanbul''s alternative neighborhoods and meet local artists.', 'Istanbul, Turkey', 'Street Art', 'Beginner', 150, 25, true, true, 4.7, 87, 63, '{"English", "Turkish"}', 'Afternoon (3-5 PM)', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800'),
    (ahmed_id, 'Hagia Sophia Through Ages', 'Journey through 1,500 years of history as this iconic building transformed from church to mosque to museum and back.', 'Istanbul, Turkey', 'History', 'Intermediate', 90, 22, true, true, 4.8, 156, 112, '{"English", "Turkish"}', 'Morning (10-12 PM)', 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800');

    -- Insert audio guides for Giulia (Culinary)
    INSERT INTO public.audio_guides (
        creator_id, title, description, location, category, difficulty, duration, price_usd,
        is_published, is_approved, rating, total_reviews, total_purchases,
        languages, best_time, image_url
    ) VALUES
    (giulia_id, 'Flavors of Trastevere', 'Taste authentic Roman cuisine in the charming cobblestone streets of Trastevere while learning traditional recipes.', 'Rome, Italy', 'Food Tour', 'Beginner', 180, 40, true, true, 4.9, 234, 178, '{"English", "Italian"}', 'Evening (6-9 PM)', 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800'),
    (giulia_id, 'Roman Market Adventure', 'Shop like a local in Rome''s historic markets while learning about seasonal ingredients and traditional cooking methods.', 'Rome, Italy', 'Markets', 'Beginner', 120, 28, true, true, 4.6, 89, 67, '{"English", "Italian"}', 'Morning (9-11 AM)', 'https://images.unsplash.com/photo-1566848012687-3e8b7b2d0e78?w=800');

    -- Insert audio guides for Erik (Adventure)
    INSERT INTO public.audio_guides (
        creator_id, title, description, location, category, difficulty, duration, price_usd,
        is_published, is_approved, rating, total_reviews, total_purchases,
        languages, best_time, image_url
    ) VALUES
    (erik_id, 'Cappadocia Balloon Photography', 'Learn aerial photography techniques while floating over Cappadocia''s fairy chimneys in a hot air balloon.', 'Cappadocia, Turkey', 'Photography', 'Advanced', 240, 85, true, true, 4.9, 167, 123, '{"English", "Turkish"}', 'Sunrise (5-9 AM)', 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800'),
    (erik_id, 'Underground Cities Exploration', 'Venture into Cappadocia''s mysterious underground cities and learn about their geological formation and historical significance.', 'Cappadocia, Turkey', 'Adventure', 'Intermediate', 180, 35, true, true, 4.7, 98, 72, '{"English", "Turkish"}', 'Afternoon (2-5 PM)', 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800');

END $$;

-- Insert viral metrics to make some creators/guides trending
INSERT INTO public.viral_metrics (guide_id, date, views_count, shares_count, downloads_count, viral_score, trending_rank) 
SELECT 
    ag.id as guide_id,
    CURRENT_DATE,
    CASE 
        WHEN ag.total_purchases > 150 THEN 850 + random() * 200
        WHEN ag.total_purchases > 100 THEN 450 + random() * 150  
        WHEN ag.total_purchases > 50 THEN 250 + random() * 100
        ELSE 100 + random() * 50
    END as views_count,
    CASE 
        WHEN ag.total_purchases > 150 THEN 45 + random() * 20
        WHEN ag.total_purchases > 100 THEN 25 + random() * 15
        WHEN ag.total_purchases > 50 THEN 15 + random() * 10
        ELSE 5 + random() * 5
    END as shares_count,
    ag.total_purchases as downloads_count,
    CASE 
        WHEN ag.total_purchases > 150 THEN 85 + random() * 15
        WHEN ag.total_purchases > 100 THEN 70 + random() * 15
        WHEN ag.total_purchases > 50 THEN 55 + random() * 15
        ELSE 30 + random() * 20
    END as viral_score,
    row_number() OVER (ORDER BY ag.total_purchases DESC, ag.rating DESC) as trending_rank
FROM public.audio_guides ag
WHERE ag.creator_id IN (
    SELECT user_id FROM public.profiles WHERE role = 'content_creator'
);

-- Update trending locations based on our demo guides
INSERT INTO public.trending_locations (name, country, guides_count, total_views, growth_percentage, trending_rank, coordinates) VALUES
('Paris', 'France', 3, 2450, 15.5, 1, POINT(2.3522, 48.8566)),
('Kyoto', 'Japan', 3, 2100, 22.1, 2, POINT(135.7681, 35.0116)),
('Rome', 'Italy', 2, 1850, 18.7, 3, POINT(12.4964, 41.9028)),
('Machu Picchu', 'Peru', 2, 1650, 28.3, 4, POINT(-72.5450, -13.1631)),
('Istanbul', 'Turkey', 2, 1420, 20.9, 5, POINT(28.9784, 41.0082)),
('Santorini', 'Greece', 2, 1380, 25.4, 6, POINT(25.4615, 36.3932)),
('Cappadocia', 'Turkey', 2, 1200, 31.2, 7, POINT(34.8403, 38.6431))
ON CONFLICT (name, country) DO UPDATE SET
    guides_count = EXCLUDED.guides_count,
    total_views = EXCLUDED.total_views,
    growth_percentage = EXCLUDED.growth_percentage,
    trending_rank = EXCLUDED.trending_rank,
    last_updated = now();