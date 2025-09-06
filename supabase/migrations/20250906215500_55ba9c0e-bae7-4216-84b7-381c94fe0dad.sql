-- Add sample verification requests only (these don't violate constraints)
INSERT INTO public.verification_requests (
  id, user_id, full_name, experience_description, portfolio_url, 
  social_media_links, status, submitted_at, reviewed_at, reviewed_by, admin_notes
) VALUES 
(
  '650e8400-e29b-41d4-a716-446655440001', 
  gen_random_uuid(), 
  'David Thompson', 
  'Professional photographer and travel writer with 5 years of experience creating visual stories about European destinations. Specialized in architectural photography and cultural documentation.',
  'https://davidthompsonphoto.com',
  '{"instagram": "https://instagram.com/davidphoto", "website": "https://davidthompsonphoto.com"}',
  'pending',
  now() - interval '3 days',
  null,
  null,
  null
),
(
  '650e8400-e29b-41d4-a716-446655440002',
  gen_random_uuid(),
  'Amara Okafor',
  'Licensed tour guide in Lagos and Abuja with expertise in Nigerian history and contemporary culture. Fluent in English, Yoruba, and Igbo.',
  'https://amaraguides.ng',
  '{"linkedin": "https://linkedin.com/in/amara-okafor", "facebook": "https://facebook.com/amaraguides"}',
  'pending',
  now() - interval '1 day',
  null,
  null,
  null
),
(
  '650e8400-e29b-41d4-a716-446655440003',
  gen_random_uuid(),
  'Marco Rossi',
  'Professional tour guide specializing in Italian Renaissance art and architecture. 15 years of experience guiding visitors through Rome and Florence.',
  'https://marcorossi-guides.it',
  '{"website": "https://marcorossi-guides.it", "tripadvisor": "https://tripadvisor.com/marco-rossi"}',
  'approved',
  now() - interval '35 days',
  now() - interval '30 days',
  gen_random_uuid(),
  'Excellent credentials and portfolio. Approved for creator status.'
),
(
  '650e8400-e29b-41d4-a716-446655440004',
  gen_random_uuid(),
  'John Smith',
  'Travel blogger with 1 year of experience',
  null,
  '{"instagram": "https://instagram.com/johntravel"}',
  'rejected',
  now() - interval '20 days',
  now() - interval '18 days',
  gen_random_uuid(),
  'Insufficient professional experience. Please reapply after gaining more credentials in the travel industry.'
),
(
  '650e8400-e29b-41d4-a716-446655440005',
  gen_random_uuid(),
  'Elena Rodriguez',
  'Archaeologist and certified guide specializing in Pre-Columbian civilizations and Andean culture. PhD in Archaeology from Universidad de Lima with 12 years of field experience.',
  'https://elena-heritage.com',
  '{"linkedin": "https://linkedin.com/in/elena-rodriguez-archaeologist", "website": "https://elena-heritage.com"}',
  'pending',
  now() - interval '7 days',
  null,
  null,
  null
) ON CONFLICT (id) DO NOTHING;