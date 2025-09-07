-- Add creator_type field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN creator_type text CHECK (creator_type IN ('influencer', 'local_guide', 'expert')) DEFAULT 'local_guide';

-- Update existing creators with default types
UPDATE public.profiles 
SET creator_type = CASE 
  WHEN role = 'content_creator' THEN 'local_guide'
  ELSE 'local_guide'
END
WHERE creator_type IS NULL;