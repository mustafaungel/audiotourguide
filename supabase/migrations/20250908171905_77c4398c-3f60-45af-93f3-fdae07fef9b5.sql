-- Remove difficulty and rating data from database
UPDATE public.audio_guides 
SET 
  difficulty = NULL,
  rating = 0,
  total_reviews = 0
WHERE difficulty IS NOT NULL OR rating > 0;

UPDATE public.destinations 
SET difficulty_level = NULL
WHERE difficulty_level IS NOT NULL;

-- Clean up any beginner references in other tables if they exist
UPDATE public.profiles 
SET specialties = array_remove(specialties, 'beginner')
WHERE 'beginner' = ANY(specialties);