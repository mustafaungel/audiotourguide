-- First create sample audio guides without specific creators, then we'll enhance CreatorRecommendations to show viral creators
-- Insert sample audio guides with viral metrics
INSERT INTO public.audio_guides (
  title, description, location, category, difficulty, duration, price_usd,
  is_published, is_approved, rating, total_reviews, total_purchases,
  languages, best_time, image_url, creator_id
) VALUES
-- Popular Art Guides
('Masterpieces of the Louvre', 'Discover the stories behind the world''s most famous artworks including the Mona Lisa, Venus de Milo, and Winged Victory.', 'Paris, France', 'Museums', 'Beginner', 120, 25, true, true, 4.8, 127, 89, '{"English", "French"}', 'Morning (9-11 AM)', 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

('Vatican Museums Deep Dive', 'An intimate journey through the Vatican''s treasures, from Michelangelo''s Sistine Chapel to the Renaissance Rooms.', 'Vatican City', 'Museums', 'Intermediate', 180, 35, true, true, 4.9, 203, 156, '{"English", "Italian"}', 'Early Morning (8-10 AM)', 'https://images.unsplash.com/photo-1478391679764-b2d8b3cd1e94?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

-- Trending Cultural Guides
('Zen Temples of Kyoto', 'Experience tranquility in Kyoto''s most sacred temples while learning about Buddhist philosophy and Japanese spirituality.', 'Kyoto, Japan', 'Temples', 'Beginner', 180, 28, true, true, 4.9, 145, 112, '{"English", "Japanese"}', 'Early Morning (7-9 AM)', 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

('Hidden Gems of Gion District', 'Discover the secret world of geishas, traditional tea houses, and preserved Edo-period streets.', 'Kyoto, Japan', 'Cultural', 'Intermediate', 120, 32, true, true, 4.8, 89, 73, '{"English", "Japanese"}', 'Evening (5-7 PM)', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

-- Viral Adventure Guides
('Mysteries of Machu Picchu', 'Uncover the secrets of the Lost City of the Incas with insights from recent archaeological discoveries.', 'Machu Picchu, Peru', 'Archaeology', 'Intermediate', 240, 45, true, true, 4.9, 278, 201, '{"English", "Spanish"}', 'Early Morning (6-8 AM)', 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

('Sacred Valley Inca Trail', 'Follow ancient Inca paths through the Sacred Valley, visiting lesser-known ruins and learning about Andean culture.', 'Sacred Valley, Peru', 'Hiking', 'Advanced', 300, 55, true, true, 4.8, 156, 89, '{"English", "Spanish"}', 'Full Day (8 AM-2 PM)', 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

-- Architecture & Urban Guides
('Gothic Marvels of Notre-Dame', 'Explore the architectural genius of Notre-Dame Cathedral and learn about Gothic innovation and restoration.', 'Paris, France', 'Architecture', 'Intermediate', 90, 20, true, true, 4.7, 134, 98, '{"English", "French"}', 'Afternoon (2-4 PM)', 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

('Istanbul Street Art Revolution', 'Explore the vibrant street art scene in Istanbul''s alternative neighborhoods and meet local artists.', 'Istanbul, Turkey', 'Street Art', 'Beginner', 150, 25, true, true, 4.7, 87, 63, '{"English", "Turkish"}', 'Afternoon (3-5 PM)', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

('Hagia Sophia Through Ages', 'Journey through 1,500 years of history as this iconic building transformed from church to mosque to museum and back.', 'Istanbul, Turkey', 'History', 'Intermediate', 90, 22, true, true, 4.8, 156, 112, '{"English", "Turkish"}', 'Morning (10-12 PM)', 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

-- Culinary & Nature Guides
('Flavors of Trastevere', 'Taste authentic Roman cuisine in the charming cobblestone streets of Trastevere while learning traditional recipes.', 'Rome, Italy', 'Food Tour', 'Beginner', 180, 40, true, true, 4.9, 234, 178, '{"English", "Italian"}', 'Evening (6-9 PM)', 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

('Santorini Marine Life Safari', 'Dive into the underwater world of the Aegean Sea and discover unique marine ecosystems around volcanic islands.', 'Santorini, Greece', 'Marine Biology', 'Intermediate', 180, 38, true, true, 4.8, 92, 67, '{"English", "Greek"}', 'Morning (9-11 AM)', 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

('Photography Sunset Tour', 'Capture the perfect sunset shots while learning professional photography techniques in one of the world''s most photogenic locations.', 'Santorini, Greece', 'Photography', 'Beginner', 120, 30, true, true, 4.9, 118, 89, '{"English", "Greek"}', 'Evening (6-8 PM)', 'https://images.unsplash.com/photo-1571501679680-de32f1e7aad4?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

-- Adventure Photography
('Cappadocia Balloon Photography', 'Learn aerial photography techniques while floating over Cappadocia''s fairy chimneys in a hot air balloon.', 'Cappadocia, Turkey', 'Photography', 'Advanced', 240, 85, true, true, 4.9, 167, 123, '{"English", "Turkish"}', 'Sunrise (5-9 AM)', 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1)),

('Underground Cities Exploration', 'Venture into Cappadocia''s mysterious underground cities and learn about their geological formation and historical significance.', 'Cappadocia, Turkey', 'Adventure', 'Intermediate', 180, 35, true, true, 4.7, 98, 72, '{"English", "Turkish"}', 'Afternoon (2-5 PM)', 'https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800', (SELECT user_id FROM public.profiles WHERE role = 'content_creator' LIMIT 1));

-- Insert viral metrics to make guides trending
INSERT INTO public.viral_metrics (guide_id, date, views_count, shares_count, downloads_count, viral_score, trending_rank) 
SELECT 
    ag.id as guide_id,
    CURRENT_DATE,
    CASE 
        WHEN ag.total_purchases > 150 THEN 850 + (random() * 200)::integer
        WHEN ag.total_purchases > 100 THEN 450 + (random() * 150)::integer 
        WHEN ag.total_purchases > 50 THEN 250 + (random() * 100)::integer
        ELSE 100 + (random() * 50)::integer
    END as views_count,
    CASE 
        WHEN ag.total_purchases > 150 THEN 45 + (random() * 20)::integer
        WHEN ag.total_purchases > 100 THEN 25 + (random() * 15)::integer
        WHEN ag.total_purchases > 50 THEN 15 + (random() * 10)::integer
        ELSE 5 + (random() * 5)::integer
    END as shares_count,
    ag.total_purchases as downloads_count,
    CASE 
        WHEN ag.total_purchases > 150 THEN 85 + (random() * 15)::integer
        WHEN ag.total_purchases > 100 THEN 70 + (random() * 15)::integer
        WHEN ag.total_purchases > 50 THEN 55 + (random() * 15)::integer
        ELSE 30 + (random() * 20)::integer
    END as viral_score,
    row_number() OVER (ORDER BY ag.total_purchases DESC, ag.rating DESC) as trending_rank
FROM public.audio_guides ag
WHERE ag.title IN (
    'Masterpieces of the Louvre', 'Vatican Museums Deep Dive', 'Zen Temples of Kyoto', 
    'Hidden Gems of Gion District', 'Mysteries of Machu Picchu', 'Sacred Valley Inca Trail',
    'Gothic Marvels of Notre-Dame', 'Istanbul Street Art Revolution', 'Hagia Sophia Through Ages',
    'Flavors of Trastevere', 'Santorini Marine Life Safari', 'Photography Sunset Tour',
    'Cappadocia Balloon Photography', 'Underground Cities Exploration'
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