-- Remove creator/experience/community tables step by step
-- First drop the tables to avoid policy conflicts

DROP TABLE IF EXISTS public.story_reactions CASCADE;
DROP TABLE IF EXISTS public.story_views CASCADE; 
DROP TABLE IF EXISTS public.creator_stories CASCADE;
DROP TABLE IF EXISTS public.creator_messages CASCADE;
DROP TABLE IF EXISTS public.creator_updates CASCADE;
DROP TABLE IF EXISTS public.creator_connections CASCADE;
DROP TABLE IF EXISTS public.creator_service_ratings CASCADE;
DROP TABLE IF EXISTS public.creator_platform_ratings CASCADE;
DROP TABLE IF EXISTS public.creator_earnings CASCADE;
DROP TABLE IF EXISTS public.tier_history CASCADE;
DROP TABLE IF EXISTS public.creator_availability CASCADE;
DROP TABLE IF EXISTS public.experience_bookings CASCADE;
DROP TABLE IF EXISTS public.live_experiences CASCADE;
DROP TABLE IF EXISTS public.creator_tiers CASCADE;

-- Remove creator-specific columns from profiles
ALTER TABLE public.profiles 
  DROP COLUMN IF EXISTS creator_badge,
  DROP COLUMN IF EXISTS service_rating,
  DROP COLUMN IF EXISTS service_rating_count,
  DROP COLUMN IF EXISTS platform_rating,
  DROP COLUMN IF EXISTS platform_rating_count,
  DROP COLUMN IF EXISTS combined_rating,
  DROP COLUMN IF EXISTS creator_type,
  DROP COLUMN IF EXISTS current_tier,
  DROP COLUMN IF EXISTS tier_points,
  DROP COLUMN IF EXISTS tier_updated_at;

-- For now, just update existing content_creator roles to traveler
UPDATE public.profiles SET role = 'traveler' WHERE role = 'content_creator';

-- Remove creator_id from audio_guides (this will require updating existing guides)
-- For now, we'll just drop the column and set a default user for orphaned guides
ALTER TABLE public.audio_guides DROP COLUMN IF EXISTS creator_id CASCADE;

-- Clean up verification requests to remove creator-specific fields
ALTER TABLE public.verification_requests 
  DROP COLUMN IF EXISTS creator_type,
  DROP COLUMN IF EXISTS verification_level;