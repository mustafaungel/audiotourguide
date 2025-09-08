-- Remove all creator-focused, live experience, and community database tables

-- Drop tables in proper order to handle foreign key dependencies
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

-- Update user_role enum to remove creator roles
ALTER TYPE user_role RENAME TO user_role_old;
CREATE TYPE user_role AS ENUM ('traveler', 'admin');

-- Update profiles table to use new enum and remove creator-specific columns
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
  DROP COLUMN IF EXISTS tier_updated_at,
  ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Drop the old enum
DROP TYPE user_role_old;

-- Remove creator-related functions
DROP FUNCTION IF EXISTS public.update_creator_tier(uuid);
DROP FUNCTION IF EXISTS public.calculate_tier_points(uuid);
DROP FUNCTION IF EXISTS public.update_creator_ratings();
DROP FUNCTION IF EXISTS public.connect_user_to_creator();

-- Remove creator-related triggers
DROP TRIGGER IF EXISTS update_creator_ratings_service ON public.creator_service_ratings;
DROP TRIGGER IF EXISTS update_creator_ratings_platform ON public.creator_platform_ratings;
DROP TRIGGER IF EXISTS connect_user_to_creator_trigger ON public.user_purchases;

-- Update audio_guides table to remove creator references
ALTER TABLE public.audio_guides 
  DROP COLUMN IF EXISTS creator_id CASCADE;