-- Insert demo creator profiles with verification and tier data
INSERT INTO public.profiles (user_id, email, full_name, bio, avatar_url, role, verification_status, verified_at, creator_badge, specialties, guide_country, experience_years, languages_spoken, current_tier, tier_points, social_profiles) VALUES
-- Marco Romano (Bronze, Italy)
('11111111-1111-1111-1111-111111111111', 'marco.romano@email.com', 'Marco Romano', 'Passionate archaeological guide specializing in ancient Roman history and UNESCO heritage sites. Join me for immersive journeys through time in the Eternal City.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face', 'content_creator', 'verified', now() - interval '3 months', true, ARRAY['Archaeological Sites', 'Cultural Heritage', 'Roman History'], 'Italy', 2, ARRAY['Italian', 'English'], 'bronze', 150, '{"instagram": "marco_rome_guide", "website": "www.romewithamarco.com"}'),

-- Sakura Tanaka (Silver, Japan)
('22222222-2222-2222-2222-222222222222', 'sakura.tanaka@email.com', 'Sakura Tanaka', 'Traditional Japanese culture expert and temple guide. I share the spiritual beauty and historical depth of Kyoto through authentic cultural experiences.', 'https://images.unsplash.com/photo-1494790108755-2616b612b632?w=400&h=400&fit=crop&crop=face', 'content_creator', 'verified', now() - interval '8 months', true, ARRAY['Cultural Heritage', 'Temples', 'Traditional Arts'], 'Japan', 5, ARRAY['Japanese', 'English', 'Mandarin'], 'silver', 420, '{"instagram": "sakura_kyoto", "facebook": "KyotoWithSakura"}'),

-- Ahmed Hassan (Gold, Egypt)
('33333333-3333-3333-3333-333333333333', 'ahmed.hassan@email.com', 'Ahmed Hassan', 'Egyptologist and UNESCO World Heritage specialist with extensive knowledge of ancient civilizations. Discover the mysteries of Egypt with expert archaeological insights.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face', 'content_creator', 'verified', now() - interval '1 year', true, ARRAY['Archaeological Sites', 'UNESCO Heritage', 'Ancient Civilizations'], 'Egypt', 8, ARRAY['Arabic', 'English', 'French'], 'gold', 780, '{"linkedin": "ahmed-hassan-egyptologist", "website": "www.egyptwitahahmed.com"}'),

-- Elena Vasquez (Diamond, Spain)
('44444444-4444-4444-4444-444444444444', 'elena.vasquez@email.com', 'Elena Vasquez', 'Art historian and museum curator specializing in Renaissance and modern art. Experience world-class museums and galleries through the eyes of an expert.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face', 'content_creator', 'verified', now() - interval '2 years', true, ARRAY['Art & Museums', 'Renaissance Art', 'Cultural Heritage'], 'Spain', 12, ARRAY['Spanish', 'English', 'French', 'Italian'], 'diamond', 1200, '{"linkedin": "elena-vasquez-art", "instagram": "elena_art_madrid"}'),

-- James Fletcher (Gold, UK)
('55555555-5555-5555-5555-555555555555', 'james.fletcher@email.com', 'James Fletcher', 'British history enthusiast and castle specialist. Explore centuries of history through medieval castles, royal palaces, and historic battlefields across the UK.', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face', 'content_creator', 'verified', now() - interval '10 months', true, ARRAY['Historical Sites', 'Medieval History', 'Castles'], 'United Kingdom', 7, ARRAY['English'], 'gold', 690, '{"instagram": "james_uk_history", "website": "www.britishheritage.tours"}'),

-- Lisa Chen (Silver, Singapore)
('66666666-6666-6666-6666-666666666666', 'lisa.chen@email.com', 'Lisa Chen', 'Cultural influencer and food heritage guide. Discover Singapore's diverse culinary landscape and multicultural heritage through authentic local experiences.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face', 'content_creator', 'verified', now() - interval '6 months', true, ARRAY['Food Culture', 'Multicultural Heritage', 'Urban Exploration'], 'Singapore', 4, ARRAY['English', 'Mandarin', 'Malay'], 'silver', 380, '{"instagram": "lisa_sg_eats", "tiktok": "lisa_singapore", "youtube": "Lisa Chen Singapore"}'),

-- Carlos Mendoza (Bronze, Mexico)
('77777777-7777-7777-7777-777777777777', 'carlos.mendoza@email.com', 'Carlos Mendoza', 'Adventure guide and nature enthusiast exploring Mexico's natural wonders. From ancient cenotes to volcanic landscapes, discover the country's incredible biodiversity.', 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&h=400&fit=crop&crop=face', 'content_creator', 'verified', now() - interval '1 month', true, ARRAY['Natural Wonders', 'Adventure Tourism', 'Ecology'], 'Mexico', 1, ARRAY['Spanish', 'English'], 'bronze', 85, '{"instagram": "carlos_mexico_nature"}'),

-- Priya Sharma (Gold, India)
('88888888-8888-8888-8888-888888888888', 'priya.sharma@email.com', 'Priya Sharma', 'UNESCO World Heritage expert and cultural anthropologist. Experience India's rich spiritual and architectural heritage through immersive storytelling and local wisdom.', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face', 'content_creator', 'verified', now() - interval '15 months', true, ARRAY['UNESCO Heritage', 'Spiritual Tourism', 'Architecture'], 'India', 9, ARRAY['Hindi', 'English', 'Bengali'], 'gold', 850, '{"instagram": "priya_india_heritage", "website": "www.indiaheritage.guide"}');

-- Insert demo audio guides for these creators
INSERT INTO public.audio_guides (id, creator_id, title, description, location, category, duration, price_usd, difficulty, languages, is_published, is_approved, rating, total_reviews, total_purchases, best_time, image_url, audio_url, transcript, preview_url) VALUES
-- Marco Romano's guides
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Colosseum: Gladiators & Glory', 'Step into the arena where gladiators fought for freedom and glory. Discover the incredible engineering and brutal history of Rome''s most iconic monument.', 'Rome, Italy', 'Archaeological Site', 45, 1200, 'Easy', ARRAY['English', 'Italian'], true, true, 4.3, 15, 89, 'Morning (8-10 AM) to avoid crowds', '/placeholder.svg', '/audio/colosseum.mp3', 'Welcome to the Colosseum...', '/audio/colosseum-preview.mp3'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Roman Forum: Heart of Empire', 'Walk through the political and commercial center of ancient Rome. Experience where Caesar spoke and emperors ruled the known world.', 'Rome, Italy', 'Archaeological Site', 50, 1400, 'Moderate', ARRAY['English', 'Italian'], true, true, 4.1, 12, 67, 'Late morning (10 AM-12 PM)', '/placeholder.svg', '/audio/forum.mp3', 'Standing in the Roman Forum...', '/audio/forum-preview.mp3'),

-- Sakura Tanaka's guides
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Kyoto Temples: Spiritual Journey', 'Explore the serene world of Buddhist and Shinto temples. Learn meditation practices and the philosophy behind Japanese spirituality.', 'Kyoto, Japan', 'Cultural Heritage', 60, 1800, 'Easy', ARRAY['English', 'Japanese'], true, true, 4.7, 23, 134, 'Early morning (6-8 AM) for meditation', '/placeholder.svg', '/audio/kyoto-temples.mp3', 'Welcome to the sacred temples of Kyoto...', '/audio/kyoto-preview.mp3'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Traditional Tea Ceremony', 'Experience the art of Japanese tea ceremony in historic Kyoto. Learn the philosophy of harmony, respect, purity, and tranquility.', 'Kyoto, Japan', 'Cultural Heritage', 40, 1600, 'Easy', ARRAY['English', 'Japanese'], true, true, 4.9, 18, 98, 'Afternoon (2-4 PM)', '/placeholder.svg', '/audio/tea-ceremony.mp3', 'In the quiet tea house...', '/audio/tea-preview.mp3'),

-- Ahmed Hassan's guides
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '33333333-3333-3333-3333-333333333333', 'Pyramids of Giza: Ancient Mysteries', 'Uncover the secrets of the last surviving Wonder of the Ancient World. Explore cutting-edge theories about pyramid construction and purpose.', 'Giza, Egypt', 'UNESCO Heritage', 75, 2200, 'Moderate', ARRAY['English', 'Arabic'], true, true, 4.6, 31, 187, 'Early morning (6-8 AM) or late afternoon', '/placeholder.svg', '/audio/pyramids.mp3', 'Before you stands the Great Pyramid...', '/audio/pyramids-preview.mp3'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'Valley of the Kings: Royal Tombs', 'Journey into the eternal resting place of pharaohs. Discover incredible wall paintings and burial practices of ancient Egypt.', 'Luxor, Egypt', 'Archaeological Site', 65, 2000, 'Moderate', ARRAY['English', 'Arabic'], true, true, 4.4, 28, 156, 'Morning (8-11 AM)', '/placeholder.svg', '/audio/valley-kings.mp3', 'Deep in the Valley of the Kings...', '/audio/valley-preview.mp3'),

-- Elena Vasquez's guides
('gggggggg-gggg-gggg-gggg-gggggggggggg', '44444444-4444-4444-4444-444444444444', 'Prado Museum: Spanish Masters', 'Immerse yourself in the world of Velázquez, Goya, and El Greco. Discover the stories behind Spain''s greatest masterpieces.', 'Madrid, Spain', 'Art & Museums', 90, 2500, 'Easy', ARRAY['Spanish', 'English'], true, true, 4.8, 45, 298, 'Weekday mornings (10 AM-12 PM)', '/placeholder.svg', '/audio/prado.mp3', 'Welcome to the Prado Museum...', '/audio/prado-preview.mp3'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '44444444-4444-4444-4444-444444444444', 'Sagrada Familia: Gaudí''s Vision', 'Experience the architectural genius of Antoni Gaudí. Understand the symbolism and innovative techniques of this UNESCO masterpiece.', 'Barcelona, Spain', 'UNESCO Heritage', 70, 2200, 'Moderate', ARRAY['Spanish', 'English'], true, true, 4.9, 52, 412, 'Morning (9-11 AM) for best lighting', '/placeholder.svg', '/audio/sagrada.mp3', 'Gazing up at Gaudí''s masterpiece...', '/audio/sagrada-preview.mp3'),

-- James Fletcher's guides
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', '55555555-5555-5555-5555-555555555555', 'Tower of London: Royal Fortress', 'Explore 1000 years of royal history, from William the Conqueror to the Crown Jewels. Discover tales of intrigue, imprisonment, and execution.', 'London, UK', 'Historical Sites', 80, 2100, 'Easy', ARRAY['English'], true, true, 4.5, 38, 234, 'Weekday mornings (9-11 AM)', '/placeholder.svg', '/audio/tower-london.mp3', 'Welcome to the Tower of London...', '/audio/tower-preview.mp3'),

-- Lisa Chen's guides
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', '66666666-6666-6666-6666-666666666666', 'Singapore Food Heritage Trail', 'Discover the multicultural food scene that defines Singapore. From hawker centers to heritage recipes passed down through generations.', 'Singapore', 'Food Culture', 55, 1700, 'Easy', ARRAY['English', 'Mandarin'], true, true, 4.6, 29, 178, 'Evening (6-8 PM) for best food experiences', '/placeholder.svg', '/audio/sg-food.mp3', 'Welcome to Singapore''s food paradise...', '/audio/sg-food-preview.mp3'),

-- Carlos Mendoza's guides
('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', '77777777-7777-7777-7777-777777777777', 'Cenotes: Sacred Underground Rivers', 'Dive into Mexico''s mystical cenotes. Learn about Mayan beliefs and the geological wonders of the Yucatan Peninsula.', 'Yucatan, Mexico', 'Natural Wonders', 45, 1500, 'Easy', ARRAY['Spanish', 'English'], true, true, 4.2, 16, 93, 'Midday (11 AM-1 PM) for best light', '/placeholder.svg', '/audio/cenotes.mp3', 'Descending into the sacred cenote...', '/audio/cenotes-preview.mp3'),

-- Priya Sharma's guides
('llllllll-llll-llll-llll-llllllllllll', '88888888-8888-8888-8888-888888888888', 'Taj Mahal: Monument of Love', 'Experience the world''s most beautiful monument to love. Discover the architectural brilliance and romantic story behind this UNESCO wonder.', 'Agra, India', 'UNESCO Heritage', 65, 1900, 'Easy', ARRAY['Hindi', 'English'], true, true, 4.7, 41, 267, 'Sunrise (5:30-7:30 AM) or sunset', '/placeholder.svg', '/audio/taj-mahal.mp3', 'As the sun rises behind the Taj Mahal...', '/audio/taj-preview.mp3'),
('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', '88888888-8888-8888-8888-888888888888', 'Varanasi: City of Light', 'Journey through one of the world''s oldest cities. Experience the spiritual heart of India along the sacred Ganges River.', 'Varanasi, India', 'Spiritual Tourism', 70, 1800, 'Moderate', ARRAY['Hindi', 'English'], true, true, 4.4, 33, 198, 'Early morning (5-7 AM) for ceremonies', '/placeholder.svg', '/audio/varanasi.mp3', 'Welcome to the eternal city of Varanasi...', '/audio/varanasi-preview.mp3');

-- Update creator tier points based on their achievements
UPDATE public.profiles SET 
  tier_points = 150,
  tier_updated_at = now()
WHERE user_id = '11111111-1111-1111-1111-111111111111';

UPDATE public.profiles SET 
  tier_points = 420,
  tier_updated_at = now()
WHERE user_id = '22222222-2222-2222-2222-222222222222';

UPDATE public.profiles SET 
  tier_points = 780,
  tier_updated_at = now()
WHERE user_id = '33333333-3333-3333-3333-333333333333';

UPDATE public.profiles SET 
  tier_points = 1200,
  tier_updated_at = now()
WHERE user_id = '44444444-4444-4444-4444-444444444444';

UPDATE public.profiles SET 
  tier_points = 690,
  tier_updated_at = now()
WHERE user_id = '55555555-5555-5555-5555-555555555555';

UPDATE public.profiles SET 
  tier_points = 380,
  tier_updated_at = now()
WHERE user_id = '66666666-6666-6666-6666-666666666666';

UPDATE public.profiles SET 
  tier_points = 85,
  tier_updated_at = now()
WHERE user_id = '77777777-7777-7777-7777-777777777777';

UPDATE public.profiles SET 
  tier_points = 850,
  tier_updated_at = now()
WHERE user_id = '88888888-8888-8888-8888-888888888888';