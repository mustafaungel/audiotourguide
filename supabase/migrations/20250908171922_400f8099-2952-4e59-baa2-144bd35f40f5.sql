-- First, set a default value for difficulty column, then clean up
UPDATE public.audio_guides 
SET difficulty = 'intermediate'
WHERE difficulty IS NULL;

-- Remove difficulty and rating data by setting to neutral values
UPDATE public.audio_guides 
SET 
  rating = 0,
  total_reviews = 0;

-- Clean up destinations
UPDATE public.destinations 
SET difficulty_level = 'intermediate'
WHERE difficulty_level IS NULL;

-- Clean up any beginner references in profiles
UPDATE public.profiles 
SET specialties = array_remove(specialties, 'beginner')
WHERE 'beginner' = ANY(specialties);